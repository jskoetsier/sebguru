const vscode = require('vscode');
const axios = require('axios');

/**
 * LLM client for making requests to either a local LLM server or the SebGuru API
 */
class LLMClient {
  constructor(config) {
    this.useLocalLLM = config.useLocalLLM;
    this.localLLMUrl = config.localLLMUrl;
    this.localLLMPath = config.localLLMPath;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.baseUrl = 'https://api.sebguru.ai/v1';
  }

  /**
   * Update the client configuration
   * @param {object} config - The new configuration
   */
  updateConfig(config) {
    this.useLocalLLM = config.useLocalLLM;
    this.localLLMUrl = config.localLLMUrl;
    this.localLLMPath = config.localLLMPath;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.maxTokens = config.maxTokens;
  }

  /**
   * Set the API key for SebGuru
   * @param {string} apiKey - The API key to use
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Set the model to use
   * @param {string} model - The model to use
   */
  setModel(model) {
    this.model = model;
  }

  /**
   * Make a request to either the local LLM server or the SebGuru API
   * @param {string} prompt - The prompt to send
   * @param {object} options - Additional options for the request
   * @returns {Promise<string>} - The response from the LLM
   */
  async makeRequest(prompt, options = {}) {
    if (this.useLocalLLM) {
      return this.makeLocalRequest(prompt, options);
    } else {
      return this.makeSebGuruRequest(prompt, options);
    }
  }

  /**
   * Make a request to the local LLM server
   * @param {string} prompt - The prompt to send
   * @param {object} options - Additional options for the request
   * @returns {Promise<string>} - The response from the local LLM
   */
  async makeLocalRequest(prompt, options = {}) {
    try {
      const url = `${this.localLLMUrl}${this.localLLMPath}`;
      console.log(`Making request to local LLM at: ${url}`);

      const response = await axios.post(
        url,
        {
          model: this.model,
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful AI coding assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Handle different response formats from various local LLM servers
      if (response.data.choices && response.data.choices.length > 0) {
        if (response.data.choices[0].message) {
          return response.data.choices[0].message.content;
        } else if (response.data.choices[0].text) {
          return response.data.choices[0].text;
        }
      } else if (response.data.response) {
        return response.data.response;
      } else if (response.data.output) {
        return response.data.output;
      } else if (typeof response.data === 'string') {
        return response.data;
      }

      console.error('Unexpected response format from local LLM:', response.data);
      throw new Error('Unexpected response format from local LLM');
    } catch (error) {
      console.error('Error making request to local LLM:', error);
      throw new Error(`Failed to get response from local LLM: ${error.message}. Make sure your local LLM server is running at ${this.localLLMUrl}`);
    }
  }

  /**
   * Make a request to the SebGuru API
   * @param {string} prompt - The prompt to send to SebGuru
   * @param {object} options - Additional options for the request
   * @returns {Promise<string>} - The response from SebGuru
   */
  async makeSebGuruRequest(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('SebGuru API key not set. Please set your API key in the extension settings or switch to using a local LLM.');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful AI coding assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error making request to SebGuru API:', error);
      throw new Error(`Failed to get response from SebGuru: ${error.message}`);
    }
  }

  /**
   * Make a request to the SebGuru API with a file context
   * @param {string} prompt - The prompt to send to SebGuru
   * @param {string} fileContent - The content of the file to provide as context
   * @param {string} fileName - The name of the file
   * @param {object} options - Additional options for the request
   * @returns {Promise<string>} - The response from SebGuru
   */
  async makeRequestWithFileContext(prompt, fileContent, fileName, options = {}) {
    const contextPrompt = `File: ${fileName}\n\n${fileContent}\n\nUser request: ${prompt}`;
    return this.makeRequest(contextPrompt, options);
  }
}

/**
 * Chat view provider for the AI assistant chat interface
 */
class AIChatViewProvider {
  constructor(client) {
    this.client = client;
    this._view = null;
    this.chatHistory = [];
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: []
    };

    this._updateWebview();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.type === 'sendMessage') {
        try {
          const userMessage = data.value;
          this.chatHistory.push({ role: 'user', content: userMessage });
          this._updateWebview();

          // Show loading indicator
          webviewView.webview.postMessage({ type: 'setLoading', value: true });

          // Get response from SebGuru
          const response = await this.client.makeRequest(userMessage, {
            systemPrompt: 'You are SebGuru, an AI coding assistant. Help the user with their coding tasks and questions.',
          });

          this.chatHistory.push({ role: 'assistant', content: response });

          // Hide loading indicator and update webview
          webviewView.webview.postMessage({ type: 'setLoading', value: false });
          this._updateWebview();
        } catch (error) {
          vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
          webviewView.webview.postMessage({ type: 'setLoading', value: false });
        }
      } else if (data.type === 'clearChat') {
        this.chatHistory = [];
        this._updateWebview();
      }
    });
  }

  _updateWebview() {
    if (!this._view) {
      return;
    }

    this._view.webview.html = this._getHtmlForWebview();
  }

  _getHtmlForWebview() {
    const chatHistoryHtml = this.chatHistory.map(message => {
      const isUser = message.role === 'user';
      const messageClass = isUser ? 'user-message' : 'assistant-message';
      const messageContent = this._formatMessageContent(message.content);

      return `
        <div class="${messageClass}-container">
          <div class="${messageClass}">
            <div class="message-header">
              <strong>${isUser ? 'You' : 'AI Assistant'}</strong>
            </div>
            <div class="message-content">
              ${messageContent}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Assistant Chat</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 0;
            margin: 0;
          }
          .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 100%;
            overflow-x: hidden;
          }
          .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
          }
          .user-message-container, .assistant-message-container {
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
          }
          .user-message {
            align-self: flex-end;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 10px 10px 0 10px;
            padding: 8px 12px;
            max-width: 80%;
            word-wrap: break-word;
          }
          .assistant-message {
            align-self: flex-start;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 10px 10px 10px 0;
            padding: 8px 12px;
            max-width: 80%;
            word-wrap: break-word;
          }
          .message-header {
            margin-bottom: 5px;
            font-weight: bold;
          }
          .input-container {
            display: flex;
            padding: 10px;
            border-top: 1px solid var(--vscode-panel-border);
          }
          #message-input {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            margin-right: 8px;
            resize: none;
            min-height: 60px;
          }
          #send-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
          #send-button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .toolbar {
            display: flex;
            justify-content: flex-end;
            padding: 5px 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
          .toolbar button {
            background: none;
            border: none;
            color: var(--vscode-button-foreground);
            cursor: pointer;
            padding: 4px 8px;
            font-size: 12px;
          }
          .toolbar button:hover {
            text-decoration: underline;
          }
          pre {
            background-color: var(--vscode-editor-background);
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
          }
          code {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
          }
          .loading {
            display: none;
            text-align: center;
            padding: 10px;
          }
          .loading.active {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="chat-container">
          <div class="toolbar">
            <button id="clear-button">Clear Chat</button>
          </div>
          <div class="messages-container">
            ${chatHistoryHtml}
            <div id="loading" class="loading">
              <p>AI Assistant is thinking...</p>
            </div>
          </div>
          <div class="input-container">
            <textarea id="message-input" placeholder="Ask AI Assistant something..."></textarea>
            <button id="send-button">Send</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          const messageInput = document.getElementById('message-input');
          const sendButton = document.getElementById('send-button');
          const clearButton = document.getElementById('clear-button');
          const loading = document.getElementById('loading');
          const messagesContainer = document.querySelector('.messages-container');

          // Scroll to bottom of messages
          function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }

          // Scroll to bottom on initial load
          scrollToBottom();

          // Send message when send button is clicked
          sendButton.addEventListener('click', () => {
            sendMessage();
          });

          // Send message when Enter key is pressed (without Shift)
          messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          });

          // Clear chat when clear button is clicked
          clearButton.addEventListener('click', () => {
            vscode.postMessage({ type: 'clearChat' });
          });

          // Send message to extension
          function sendMessage() {
            const message = messageInput.value.trim();
            if (message) {
              vscode.postMessage({
                type: 'sendMessage',
                value: message
              });
              messageInput.value = '';
            }
          }

          // Handle messages from extension
          window.addEventListener('message', (event) => {
            const message = event.data;

            if (message.type === 'setLoading') {
              if (message.value) {
                loading.classList.add('active');
              } else {
                loading.classList.remove('active');
              }
              scrollToBottom();
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  _formatMessageContent(content) {
    // Convert markdown code blocks to HTML
    const formattedContent = content.replace(/```([\w]*)\n([\s\S]*?)```/g, (_, language, code) => {
      return `<pre><code class="language-${language}">${this._escapeHtml(code)}</code></pre>`;
    });

    // Convert inline code to HTML
    return formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>');
  }

  _escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

/**
 * Workflows view provider for the AI agentic workflows
 */
class AIWorkflowsViewProvider {
  constructor(client, extensionContext) {
    this.client = client;
    this.extensionContext = extensionContext;
    this._view = null;
    this.workflows = [
      {
        id: 'explain-code',
        name: 'Explain Code',
        description: 'Get an explanation of the selected code',
        systemPrompt: 'You are an expert programmer. Explain the following code in detail, including its purpose, how it works, and any potential issues or improvements.'
      },
      {
        id: 'improve-code',
        name: 'Improve Code',
        description: 'Get suggestions to improve the selected code',
        systemPrompt: 'You are an expert programmer. Analyze the following code and suggest specific improvements for performance, readability, and best practices. Provide the improved code.'
      },
      {
        id: 'generate-tests',
        name: 'Generate Tests',
        description: 'Generate unit tests for the selected code',
        systemPrompt: 'You are an expert in test-driven development. Generate comprehensive unit tests for the following code. Include edge cases and explain your testing strategy.'
      },
      {
        id: 'document-code',
        name: 'Document Code',
        description: 'Generate documentation for the selected code',
        systemPrompt: 'You are a technical documentation expert. Create detailed documentation for the following code, including function descriptions, parameter details, return values, and usage examples.'
      },
      {
        id: 'refactor-code',
        name: 'Refactor Code',
        description: 'Refactor the selected code to improve its structure',
        systemPrompt: 'You are an expert in code refactoring. Refactor the following code to improve its structure, maintainability, and adherence to design patterns, while preserving its functionality.'
      }
    ];
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: []
    };

    this._updateWebview();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.type === 'runWorkflow') {
        const workflowId = data.workflowId;
        const workflow = this.workflows.find(w => w.id === workflowId);

        if (!workflow) {
          vscode.window.showErrorMessage(`Workflow ${workflowId} not found`);
          return;
        }

        try {
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showInformationMessage('No active editor');
            return;
          }

          const selection = editor.selection;
          const selectedText = editor.document.getText(selection);

          if (!selectedText) {
            vscode.window.showInformationMessage('No text selected');
            return;
          }

          // Show progress notification
          vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running ${workflow.name}...`,
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            const fileName = editor.document.fileName.split('/').pop();
            // Get file extension to potentially use for language-specific prompts
            const fileExtension = fileName.split('.').pop();

            // Use file extension to enhance the system prompt if needed
            const enhancedPrompt = workflow.systemPrompt +
              (fileExtension ? ` Focus on ${fileExtension} language best practices.` : '');

            const response = await this.client.makeRequestWithFileContext(
              `Apply the "${workflow.name}" workflow to this code:`,
              selectedText,
              fileName,
              {
                systemPrompt: enhancedPrompt,
                maxTokens: 4096
              }
            );

            progress.report({ increment: 100 });

            // Show results in a new editor
            const document = await vscode.workspace.openTextDocument({
              content: response,
              language: 'markdown'
            });

            await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

            return response;
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Error running workflow: ${error.message}`);
        }
      }
    });
  }

  _updateWebview() {
    if (!this._view) {
      return;
    }

    this._view.webview.html = this._getHtmlForWebview();
  }

  _getHtmlForWebview() {
    const workflowsHtml = this.workflows.map(workflow => {
      return `
        <div class="workflow-item" data-workflow-id="${workflow.id}">
          <div class="workflow-header">
            <h3>${workflow.name}</h3>
          </div>
          <div class="workflow-description">
            ${workflow.description}
          </div>
          <div class="workflow-actions">
            <button class="run-workflow-button" data-workflow-id="${workflow.id}">Run</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Workflows</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 10px;
            margin: 0;
          }
          .workflows-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .workflow-item {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            background-color: var(--vscode-editor-background);
          }
          .workflow-header {
            margin-bottom: 5px;
          }
          .workflow-header h3 {
            margin: 0;
            font-size: 14px;
          }
          .workflow-description {
            font-size: 12px;
            margin-bottom: 10px;
            color: var(--vscode-descriptionForeground);
          }
          .workflow-actions {
            display: flex;
            justify-content: flex-end;
          }
          .run-workflow-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
          }
          .run-workflow-button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="section-title">Available Workflows</div>
        <div class="workflows-container">
          ${workflowsHtml}
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Add event listeners to run workflow buttons
          document.querySelectorAll('.run-workflow-button').forEach(button => {
            button.addEventListener('click', () => {
              const workflowId = button.getAttribute('data-workflow-id');
              vscode.postMessage({
                type: 'runWorkflow',
                workflowId: workflowId
              });
            });
          });
        </script>
      </body>
      </html>
    `;
  }
}

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context - The extension context
 */
function activate(context) {
  console.log('SebGuru Assistant extension is now active');

  // Get configuration
  const config = vscode.workspace.getConfiguration('sebguru-assistant');
  const useLocalLLM = config.get('useLocalLLM');
  const localLLMUrl = config.get('localLLMUrl');
  const localLLMPath = config.get('localLLMPath');
  const apiKey = config.get('apiKey');
  const model = config.get('model');
  const maxTokens = config.get('maxTokens');

  // Create LLM client with configuration
  const client = new LLMClient({
    useLocalLLM,
    localLLMUrl,
    localLLMPath,
    apiKey,
    model,
    maxTokens
  });

  // Create webview providers
  const chatViewProvider = new AIChatViewProvider(client);
  const workflowsViewProvider = new AIWorkflowsViewProvider(client, context);

  // Register webview providers
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aiChat', chatViewProvider),
    vscode.window.registerWebviewViewProvider('aiWorkflows', workflowsViewProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sebguru-assistant.askAI', async () => {
      const input = await vscode.window.showInputBox({
        placeHolder: 'Ask AI Assistant something...',
        prompt: 'Enter your question or request for the AI Assistant'
      });

      if (input) {
        try {
          vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Asking AI Assistant...',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            const response = await client.makeRequest(input);
            progress.report({ increment: 100 });

            // Show results in a new editor
            const document = await vscode.workspace.openTextDocument({
              content: response,
              language: 'markdown'
            });

            await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

            return response;
          });
        } catch (error) {
          vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
        }
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.explainCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showInformationMessage('No text selected');
        return;
      }

      try {
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'AI Assistant is explaining code...',
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0 });

          const fileName = editor.document.fileName.split('/').pop();

          const response = await client.makeRequestWithFileContext(
            'Explain this code in detail:',
            selectedText,
            fileName,
            {
              systemPrompt: 'You are an expert programmer. Explain the following code in detail, including its purpose, how it works, and any potential issues or improvements.',
            }
          );

          progress.report({ increment: 100 });

          // Show results in a new editor
          const document = await vscode.workspace.openTextDocument({
            content: response,
            language: 'markdown'
          });

          await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

          return response;
        });
      } catch (error) {
        vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.improveCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showInformationMessage('No text selected');
        return;
      }

      try {
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'AI Assistant is improving code...',
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0 });

          const fileName = editor.document.fileName.split('/').pop();

          const response = await client.makeRequestWithFileContext(
            'Improve this code:',
            selectedText,
            fileName,
            {
              systemPrompt: 'You are an expert programmer. Analyze the following code and suggest specific improvements for performance, readability, and best practices. Provide the improved code.',
            }
          );

          progress.report({ increment: 100 });

          // Show results in a new editor
          const document = await vscode.workspace.openTextDocument({
            content: response,
            language: 'markdown'
          });

          await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

          return response;
        });
      } catch (error) {
        vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.generateCode', async () => {
      const input = await vscode.window.showInputBox({
        placeHolder: 'Describe the code you want to generate...',
        prompt: 'Enter a description of the code you want the AI Assistant to generate'
      });

      if (input) {
        try {
          vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'AI Assistant is generating code...',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            const editor = vscode.window.activeTextEditor;
            let language = 'javascript';

            if (editor) {
              const fileName = editor.document.fileName.split('.').pop();
              language = fileName || 'javascript';
            }

            const response = await client.makeRequest(
              `Generate the following code: ${input}`,
              {
                systemPrompt: `You are an expert programmer. Generate high-quality ${language} code based on the user's description. Include comments explaining the code.`,
              }
            );

            progress.report({ increment: 100 });

            // Show results in a new editor
            const document = await vscode.workspace.openTextDocument({
              content: response,
              language: language
            });

            await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

            return response;
          });
        } catch (error) {
          vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
        }
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.runWorkflow', async () => {
      const workflows = [
        { label: 'Explain Code', id: 'explain-code' },
        { label: 'Improve Code', id: 'improve-code' },
        { label: 'Generate Tests', id: 'generate-tests' },
        { label: 'Document Code', id: 'document-code' },
        { label: 'Refactor Code', id: 'refactor-code' }
      ];

      const selectedWorkflow = await vscode.window.showQuickPick(workflows, {
        placeHolder: 'Select a workflow to run'
      });

      if (selectedWorkflow) {
        const workflowId = selectedWorkflow.id;
        const workflow = workflowsViewProvider.workflows.find(w => w.id === workflowId);

        if (!workflow) {
          vscode.window.showErrorMessage(`Workflow ${workflowId} not found`);
          return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showInformationMessage('No active editor');
          return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
          vscode.window.showInformationMessage('No text selected');
          return;
        }

        try {
          vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running ${workflow.name}...`,
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            const fileName = editor.document.fileName.split('/').pop();

            const response = await client.makeRequestWithFileContext(
              `Apply the "${workflow.name}" workflow to this code:`,
              selectedText,
              fileName,
              {
                systemPrompt: workflow.systemPrompt,
                maxTokens: 4096
              }
            );

            progress.report({ increment: 100 });

            // Show results in a new editor
            const document = await vscode.workspace.openTextDocument({
              content: response,
              language: 'markdown'
            });

            await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

            return response;
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Error running workflow: ${error.message}`);
        }
      }
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('sebguru-assistant')) {
        const newConfig = vscode.workspace.getConfiguration('sebguru-assistant');
        const newUseLocalLLM = newConfig.get('useLocalLLM');
        const newLocalLLMUrl = newConfig.get('localLLMUrl');
        const newLocalLLMPath = newConfig.get('localLLMPath');
        const newApiKey = newConfig.get('apiKey');
        const newModel = newConfig.get('model');
        const newMaxTokens = newConfig.get('maxTokens');

        // Update client configuration
        client.updateConfig({
          useLocalLLM: newUseLocalLLM,
          localLLMUrl: newLocalLLMUrl,
          localLLMPath: newLocalLLMPath,
          apiKey: newApiKey,
          model: newModel,
          maxTokens: newMaxTokens
        });

        // Show appropriate message based on configuration
        if (newUseLocalLLM) {
          vscode.window.showInformationMessage(`Local LLM server set to: ${newLocalLLMUrl}${newLocalLLMPath}`);
        } else if (!newApiKey) {
          vscode.window.showWarningMessage('SebGuru API key not set. Please set your API key in the extension settings or switch to using a local LLM.');
        }
      }
    })
  );

  // Check configuration and show appropriate message
  if (useLocalLLM) {
    vscode.window.showInformationMessage(`Using local LLM server at: ${localLLMUrl}${localLLMPath}`);
  } else if (!apiKey) {
    vscode.window.showWarningMessage('SebGuru API key not set. Please set your API key in the extension settings or switch to using a local LLM.');
  }
}

/**
 * Deactivate the extension
 */
function deactivate() {
  console.log('SebGuru Assistant extension is now deactivated');
}

module.exports = {
  activate,
  deactivate
};
