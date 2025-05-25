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
    this.apiHostname = config.apiHostname || 'localhost:3000';
    this.apiVersion = config.apiVersion || 'v1';
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.baseUrl = `https://${this.apiHostname}/${this.apiVersion}`;
  }

  /**
   * Update the client configuration
   * @param {object} config - The new configuration
   */
  updateConfig(config) {
    this.useLocalLLM = config.useLocalLLM;
    this.localLLMUrl = config.localLLMUrl;
    this.localLLMPath = config.localLLMPath;

    // Update API hostname and version if provided
    if (config.apiHostname) {
      this.apiHostname = config.apiHostname;
      // Rebuild the base URL when hostname or version changes
      this.baseUrl = `https://${this.apiHostname}/${this.apiVersion}`;
    }

    if (config.apiVersion) {
      this.apiVersion = config.apiVersion;
      // Rebuild the base URL when hostname or version changes
      this.baseUrl = `https://${this.apiHostname}/${this.apiVersion}`;
    }

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
  const apiHostname = config.get('apiHostname');
  const apiVersion = config.get('apiVersion');
  const apiKey = config.get('apiKey');
  const model = config.get('model');
  const maxTokens = config.get('maxTokens');

  // Create LLM client with configuration
  const client = new LLMClient({
    useLocalLLM,
    localLLMUrl,
    localLLMPath,
    apiHostname,
    apiVersion,
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

    vscode.commands.registerCommand('sebguru-assistant.createFile', async () => {
      // Get file path from user
      const filePath = await vscode.window.showInputBox({
        placeHolder: '/path/to/file.ext',
        prompt: 'Enter the path of the file to create'
      });

      if (!filePath) {
        return;
      }

      // Get file content from user or AI
      const contentSource = await vscode.window.showQuickPick(
        [
          { label: 'Empty File', description: 'Create an empty file', value: 'empty' },
          { label: 'Enter Content', description: 'Enter file content manually', value: 'manual' },
          { label: 'Generate with AI', description: 'Generate file content using AI', value: 'ai' }
        ],
        { placeHolder: 'How do you want to create the file content?' }
      );

      if (!contentSource) {
        return;
      }

      let content = '';

      if (contentSource.value === 'manual') {
        // Get content from user
        content = await vscode.window.showInputBox({
          placeHolder: 'File content...',
          prompt: 'Enter the content for the file',
          multiline: true
        });

        if (content === undefined) {
          return;
        }
      } else if (contentSource.value === 'ai') {
        // Get content description from user
        const description = await vscode.window.showInputBox({
          placeHolder: 'Describe what you want the file to contain...',
          prompt: 'Describe the content you want to generate'
        });

        if (!description) {
          return;
        }

        // Determine file type from extension
        const fileExtension = filePath.split('.').pop() || '';

        try {
          // Show progress indicator
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating file content...',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            // Generate content using AI
            content = await client.makeRequest(
              `Generate a ${fileExtension} file with the following description: ${description}.
               The file should be named ${filePath.split('/').pop()}.
               Only output the file content, no explanations or markdown formatting.`,
              {
                systemPrompt: `You are an expert programmer. Generate high-quality ${fileExtension} code based on the user's description.
                               Do not include markdown code blocks or explanations, just output the raw file content.`,
                temperature: 0.2
              }
            );

            // Clean up the content (remove markdown code blocks if present)
            content = content.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();

            progress.report({ increment: 100 });
            return content;
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Error generating file content: ${error.message}`);
          return;
        }
      }

      // Create the file
      const success = await createFile(filePath, content);
      if (success) {
        vscode.window.showInformationMessage(`File created: ${filePath}`);
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.createDirectory', async () => {
      // Get directory path from user
      const dirPath = await vscode.window.showInputBox({
        placeHolder: '/path/to/directory',
        prompt: 'Enter the path of the directory to create'
      });

      if (!dirPath) {
        return;
      }

      // Create the directory
      const success = await createDirectory(dirPath);
      if (success) {
        vscode.window.showInformationMessage(`Directory created: ${dirPath}`);
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.createStructure', async () => {
      // Get base path from user
      const basePath = await vscode.window.showInputBox({
        placeHolder: '/path/to/project',
        prompt: 'Enter the base path for the project structure'
      });

      if (!basePath) {
        return;
      }

      // Get project type from user
      const projectType = await vscode.window.showQuickPick(
        [
          { label: 'Node.js', description: 'Basic Node.js project', value: 'nodejs' },
          { label: 'React', description: 'React application', value: 'react' },
          { label: 'Python', description: 'Python project', value: 'python' },
          { label: 'Custom', description: 'Define custom structure with AI', value: 'custom' }
        ],
        { placeHolder: 'Select project type' }
      );

      if (!projectType) {
        return;
      }

      let structure = [];

      if (projectType.value === 'custom') {
        // Get structure description from user
        const description = await vscode.window.showInputBox({
          placeHolder: 'Describe the project structure...',
          prompt: 'Describe the project structure you want to create'
        });

        if (!description) {
          return;
        }

        try {
          // Show progress indicator
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating project structure...',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            // Generate structure using AI
            const response = await client.makeRequest(
              `Generate a project structure based on this description: ${description}.
               Format the response as a valid JSON array that can be parsed directly.
               Each item should have: "name" (string), "type" ("file" or "directory"), and optionally "content" (for files) or "children" (array, for directories).
               Example: [{"name": "src", "type": "directory", "children": [{"name": "index.js", "type": "file", "content": "console.log('Hello')"}]}]`,
              {
                systemPrompt: `You are an expert in software architecture. Generate a valid JSON structure for a project based on the user's description.
                               The JSON must be parseable and follow the specified format exactly. Do not include any explanations or markdown, just the JSON array.`,
                temperature: 0.2
              }
            );

            // Parse the response
            try {
              // Clean up the response (remove markdown code blocks if present)
              const cleanedResponse = response.replace(/```json\n/g, '').replace(/```$/g, '').trim();
              structure = JSON.parse(cleanedResponse);
            } catch (parseError) {
              throw new Error(`Failed to parse structure: ${parseError.message}`);
            }

            progress.report({ increment: 100 });
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Error generating project structure: ${error.message}`);
          return;
        }
      } else if (projectType.value === 'nodejs') {
        structure = [
          { name: "src", type: "directory", children: [
            { name: "index.js", type: "file", content: "console.log('Hello, Node.js!');" }
          ]},
          { name: "package.json", type: "file", content: '{\n  "name": "nodejs-project",\n  "version": "1.0.0",\n  "description": "A Node.js project",\n  "main": "src/index.js",\n  "scripts": {\n    "start": "node src/index.js",\n    "test": "echo \\"Error: no test specified\\" && exit 1"\n  },\n  "keywords": [],\n  "author": "",\n  "license": "ISC"\n}' },
          { name: ".gitignore", type: "file", content: "node_modules/\n.env\n.DS_Store" },
          { name: "README.md", type: "file", content: "# Node.js Project\n\nA simple Node.js project.\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Usage\n\n```bash\nnpm start\n```" }
        ];
      } else if (projectType.value === 'react') {
        structure = [
          { name: "public", type: "directory", children: [
            { name: "index.html", type: "file", content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>' }
          ]},
          { name: "src", type: "directory", children: [
            { name: "App.js", type: "file", content: "import React from 'react';\n\nfunction App() {\n  return (\n    <div className=\"App\">\n      <header className=\"App-header\">\n        <h1>Welcome to React</h1>\n        <p>Edit <code>src/App.js</code> and save to reload.</p>\n      </header>\n    </div>\n  );\n}\n\nexport default App;" },
            { name: "index.js", type: "file", content: "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);" },
            { name: "components", type: "directory", children: [] },
            { name: "styles", type: "directory", children: [
              { name: "App.css", type: "file", content: ".App {\n  text-align: center;\n}\n\n.App-header {\n  background-color: #282c34;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  font-size: calc(10px + 2vmin);\n  color: white;\n}" }
            ]}
          ]},
          { name: "package.json", type: "file", content: '{\n  "name": "react-app",\n  "version": "0.1.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build",\n    "test": "react-scripts test",\n    "eject": "react-scripts eject"\n  },\n  "eslintConfig": {\n    "extends": [\n      "react-app",\n      "react-app/jest"\n    ]\n  },\n  "browserslist": {\n    "production": [\n      ">0.2%",\n      "not dead",\n      "not op_mini all"\n    ],\n    "development": [\n      "last 1 chrome version",\n      "last 1 firefox version",\n      "last 1 safari version"\n    ]\n  }\n}' },
          { name: ".gitignore", type: "file", content: "# dependencies\nnode_modules\n/.pnp\n.pnp.js\n\n# testing\n/coverage\n\n# production\n/build\n\n# misc\n.DS_Store\n.env.local\n.env.development.local\n.env.test.local\n.env.production.local\n\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*" },
          { name: "README.md", type: "file", content: "# React App\n\nThis project was bootstrapped with Create React App.\n\n## Available Scripts\n\nIn the project directory, you can run:\n\n### `npm start`\n\nRuns the app in the development mode.\nOpen [http://localhost:3000](http://localhost:3000) to view it in your browser." }
        ];
      } else if (projectType.value === 'python') {
        structure = [
          { name: "src", type: "directory", children: [
            { name: "__init__.py", type: "file", content: "" },
            { name: "main.py", type: "file", content: "def main():\n    print('Hello, Python!')\n\nif __name__ == '__main__':\n    main()" }
          ]},
          { name: "tests", type: "directory", children: [
            { name: "__init__.py", type: "file", content: "" },
            { name: "test_main.py", type: "file", content: "import unittest\nfrom src.main import main\n\nclass TestMain(unittest.TestCase):\n    def test_main(self):\n        # Add your test here\n        pass\n\nif __name__ == '__main__':\n    unittest.main()" }
          ]},
          { name: "requirements.txt", type: "file", content: "# Add your dependencies here" },
          { name: "setup.py", type: "file", content: "from setuptools import setup, find_packages\n\nsetup(\n    name='python-project',\n    version='0.1.0',\n    packages=find_packages(),\n    install_requires=[\n        # Add your dependencies here\n    ],\n)" },
          { name: ".gitignore", type: "file", content: "__pycache__/\n*.py[cod]\n*$py.class\n*.so\n.Python\nenv/\nbuild/\ndevelop-eggs/\ndist/\ndownloads/\neggs/\n.eggs/\nlib/\nlib64/\nparts/\nsdist/\nvar/\n*.egg-info/\n.installed.cfg\n*.egg" },
          { name: "README.md", type: "file", content: "# Python Project\n\nA simple Python project.\n\n## Installation\n\n```bash\npip install -e .\n```\n\n## Usage\n\n```bash\npython -m src.main\n```" }
        ];
      }

      // Create the project structure
      const success = await createStructure(structure, basePath);
      if (success) {
        vscode.window.showInformationMessage(`Project structure created at: ${basePath}`);
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
        const newApiHostname = newConfig.get('apiHostname');
        const newApiVersion = newConfig.get('apiVersion');
        const newApiKey = newConfig.get('apiKey');
        const newModel = newConfig.get('model');
        const newMaxTokens = newConfig.get('maxTokens');

        // Update client configuration
        client.updateConfig({
          useLocalLLM: newUseLocalLLM,
          localLLMUrl: newLocalLLMUrl,
          localLLMPath: newLocalLLMPath,
          apiHostname: newApiHostname,
          apiVersion: newApiVersion,
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

/**
 * Create a file with the given path and content
 * @param {string} filePath - The path of the file to create
 * @param {string} content - The content to write to the file
 * @returns {Promise<void>}
 */
async function createFile(filePath, content) {
  try {
    // Ensure the directory exists
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));

    // Create the file
    const fileUri = vscode.Uri.file(filePath);
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(fileUri, encoder.encode(content));

    // Open the file in the editor
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    return true;
  } catch (error) {
    console.error(`Error creating file ${filePath}:`, error);
    vscode.window.showErrorMessage(`Failed to create file: ${error.message}`);
    return false;
  }
}

/**
 * Create a directory with the given path
 * @param {string} dirPath - The path of the directory to create
 * @returns {Promise<void>}
 */
async function createDirectory(dirPath) {
  try {
    const dirUri = vscode.Uri.file(dirPath);
    await vscode.workspace.fs.createDirectory(dirUri);
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    vscode.window.showErrorMessage(`Failed to create directory: ${error.message}`);
    return false;
  }
}

/**
 * Create a project structure based on a specification
 * @param {object} structure - The structure specification
 * @param {string} basePath - The base path for the structure
 * @returns {Promise<boolean>} - Whether the structure was created successfully
 */
async function createStructure(structure, basePath) {
  try {
    // Create the base directory if it doesn't exist
    await createDirectory(basePath);

    // Process each item in the structure
    for (const item of structure) {
      const itemPath = `${basePath}/${item.name}`;

      if (item.type === 'directory') {
        // Create directory
        await createDirectory(itemPath);

        // Process children recursively
        if (item.children && item.children.length > 0) {
          await createStructure(item.children, itemPath);
        }
      } else if (item.type === 'file') {
        // Create file with content
        await createFile(itemPath, item.content || '');
      }
    }

    return true;
  } catch (error) {
    console.error(`Error creating structure at ${basePath}:`, error);
    vscode.window.showErrorMessage(`Failed to create project structure: ${error.message}`);
    return false;
  }
}

module.exports = {
  activate,
  deactivate,
  createFile,
  createDirectory,
  createStructure
};
