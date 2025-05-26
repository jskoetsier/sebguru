const vscode = require('vscode');
const axios = require('axios');

/**
 * Helper function to recursively extract text content from an object
 * @param {object} obj - The object to extract text from
 * @param {number} depth - Current recursion depth (to prevent infinite recursion)
 * @returns {string|null} - Extracted text content or null if none found
 */
function extractTextContent(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 5) return null;

  // Handle null or undefined
  if (obj == null) return null;

  // If it's a string, return it directly
  if (typeof obj === 'string') return obj;

  // If it's an array, check each element
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const text = extractTextContent(item, depth + 1);
      if (text) return text;
    }
    return null;
  }

  // If it's an object, look for common text fields
  if (typeof obj === 'object') {
    // Check common field names that might contain text
    const textFields = ['content', 'text', 'message', 'response', 'output', 'result', 'answer', 'generated_text'];
    for (const field of textFields) {
      if (obj[field]) {
        if (typeof obj[field] === 'string') {
          return obj[field];
        } else {
          const text = extractTextContent(obj[field], depth + 1);
          if (text) return text;
        }
      }
    }

    // If no common fields found, check all fields
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const text = extractTextContent(obj[key], depth + 1);
        if (text) return text;
      }
    }
  }

  return null;
}

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
      // Ensure we don't have double slashes in the URL
      const baseUrl = this.localLLMUrl.endsWith('/') ? this.localLLMUrl.slice(0, -1) : this.localLLMUrl;
      const path = this.localLLMPath.startsWith('/') ? this.localLLMPath : '/' + this.localLLMPath;
      const url = `${baseUrl}${path}`;
      console.log(`Making request to local LLM at: ${url}`);

      // Prepare request payload based on API endpoint
      let payload;
      if (this.localLLMPath === '/api/generate') {
        // Ollama /api/generate endpoint format
        payload = {
          model: this.model,
          prompt: prompt,
          system: options.systemPrompt || 'You are a helpful AI coding assistant.',
          stream: false
        };

        // Only add options if they're specified
        if (options.temperature || options.maxTokens) {
          if (options.maxTokens || this.maxTokens) {
            payload.num_predict = options.maxTokens || this.maxTokens;
          }

          if (options.temperature) {
            payload.temperature = options.temperature;
          }
        }
      } else if (this.localLLMPath === '/api/chat') {
        // Ollama /api/chat endpoint format
        payload = {
          model: this.model,
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful AI coding assistant.' },
            { role: 'user', content: prompt }
          ],
          stream: false
        };

        // Only add options if they're specified
        if (options.temperature || options.maxTokens) {
          payload.options = {};

          if (options.maxTokens || this.maxTokens) {
            payload.options.num_predict = options.maxTokens || this.maxTokens;
          }

          if (options.temperature) {
            payload.options.temperature = options.temperature;
          }
        }
      } else {
        // OpenAI-compatible API format
        payload = {
          model: this.model,
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful AI coding assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || 0.7,
        };
      }

      console.log(`Request payload: ${JSON.stringify(payload)}`);

      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 120 seconds (2 minutes) timeout
        }
      );

      // Log the response for debugging
      console.log('Response from local LLM:', JSON.stringify(response.data, null, 2));
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers, null, 2));

      // Log specific fields to help diagnose the issue
      if (response.data) {
        console.log('Response data type:', typeof response.data);
        console.log('Response data keys:', Object.keys(response.data));

        if (response.data.message) {
          console.log('Message field type:', typeof response.data.message);
          console.log('Message field keys:', Object.keys(response.data.message));
        }
      }

      try {
        // Handle different response formats from various local LLM servers
        if (response.data.choices && response.data.choices.length > 0) {
          if (response.data.choices[0].message) {
            return response.data.choices[0].message.content;
          } else if (response.data.choices[0].text) {
            return response.data.choices[0].text;
          }
        } else if (response.data.message && response.data.message.content) {
          // Ollama API format
          return response.data.message.content;
        } else if (response.data.response) {
          return response.data.response;
        } else if (response.data.output) {
          return response.data.output;
        } else if (typeof response.data === 'string') {
          return response.data;
        }

        // If we can't find a recognized format, try to extract content from the response
        if (response.data && typeof response.data === 'object') {
          // Try to find any field that might contain the response content
          for (const key of ['content', 'text', 'result', 'answer', 'generated_text']) {
            if (response.data[key] && typeof response.data[key] === 'string') {
              return response.data[key];
            }
          }

          // If there's a message object, try to extract content from it
          if (response.data.message && typeof response.data.message === 'object') {
            for (const key of ['content', 'text', 'value']) {
              if (response.data.message[key] && typeof response.data.message[key] === 'string') {
                return response.data.message[key];
              }
            }
          }

          // Last resort: stringify the entire response if it's an object
          if (Object.keys(response.data).length > 0) {
            // Check if there's any text content in the object
            const jsonString = JSON.stringify(response.data);
            if (jsonString.length > 2) { // More than just "{}"
              // Extract any text content from the response
              const textContent = extractTextContent(response.data);
              if (textContent) {
                return textContent;
              }
              // If no text content found, return the stringified object
              return `AI response (raw format): ${jsonString}`;
            }
          }
        }

        console.error('Unexpected response format from local LLM:', response.data);
        throw new Error('Unexpected response format from local LLM');
      } catch (parseError) {
        console.error('Error parsing LLM response:', parseError);
        // Return a fallback response
        return "I encountered an error processing the response. Please try again or check the server logs.";
      }
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
    console.log('AIChatViewProvider.resolveWebviewView called');
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: []
    };

    console.log('Updating webview with HTML content');
    this._updateWebview();
    console.log('Webview HTML content updated');

    webviewView.webview.onDidReceiveMessage(async (data) => {
      console.log('AIChatViewProvider received message:', data);

      if (data.type === 'sendMessage') {
        try {
          const userMessage = data.value;
          console.log('User message received:', userMessage);

          // Add user message to chat history
          this.chatHistory.push({ role: 'user', content: userMessage });
          this._updateWebview();
          console.log('Chat history updated with user message');

          // Show loading indicator
          webviewView.webview.postMessage({ type: 'setLoading', value: true });
          console.log('Loading indicator shown');

          // Set a timeout for the request
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000);
          });

          console.log('Making request to LLM...');
          // Get response from LLM with timeout
          const response = await Promise.race([
            this.client.makeRequest(userMessage, {
              systemPrompt: `You are SebGuru, an AI coding assistant. Help the user with their coding tasks and questions.

              When asked to create a Python script or any other code, provide ONLY the complete code without any explanations or markdown formatting.
              For example, if asked to create a Python script that prints "Hello World", respond with just:

              print("Hello World")

              Do not include explanations like "I don't have access to your system" - you are integrated into VS Code
              and can provide code that the user can copy and paste into their files.

              Always provide complete, working solutions that directly address the user's request.`,
            }),
            timeoutPromise
          ]);

          console.log('Received response from LLM:', response ? response.substring(0, 100) + '...' : 'null or empty');

          // Add response to chat history
          this.chatHistory.push({ role: 'assistant', content: response });
          console.log('Chat history updated with assistant response');

          // Hide loading indicator and update webview
          webviewView.webview.postMessage({ type: 'setLoading', value: false });
          console.log('Loading indicator hidden');

          this._updateWebview();
          console.log('Webview updated with new chat history');

        } catch (error) {
          console.error('Error getting response from LLM:', error);
          vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
          webviewView.webview.postMessage({ type: 'setLoading', value: false });

          // Add error message to chat history
          this.chatHistory.push({
            role: 'assistant',
            content: `I'm sorry, I encountered an error: ${error.message}. Please try again or check the server logs.`
          });
          this._updateWebview();
        }
      } else if (data.type === 'clearChat') {
        console.log('Clearing chat history');
        this.chatHistory = [];
        this._updateWebview();
        console.log('Chat history cleared');
      }
    });
  }

  _updateWebview() {
    console.log('AIChatViewProvider._updateWebview called');
    if (!this._view) {
      console.log('AIChatViewProvider._updateWebview: _view is null');
      return;
    }

    console.log('Setting webview HTML content');
    const html = this._getHtmlForWebview();
    console.log('HTML content length:', html.length);
    this._view.webview.html = html;
    console.log('Webview HTML content set');
  }

  _getHtmlForWebview() {
    console.log('AIChatViewProvider._getHtmlForWebview called');
    console.log('Chat history length:', this.chatHistory.length);

    // Create a chat history HTML with markdown formatting
    const chatHistoryHtml = this.chatHistory.map(message => {
      const isUser = message.role === 'user';
      const formattedContent = this._formatMessageContent(message.content);
      return `<div class="${isUser ? 'user-message' : 'assistant-message'}">
        <div class="message-header">${isUser ? 'You' : 'AI Assistant'}</div>
        <div class="message-content">${formattedContent}</div>
      </div>`;
    }).join('');

    // Return a more robust HTML structure similar to the chat panel
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }

          #chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
          }

          #messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
          }

          #input-container {
            padding: 10px;
            border-top: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-editor-background);
          }

          #chat-form {
            display: flex;
          }

          #message-input {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            min-height: 20px;
          }

          #send-button {
            margin-left: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 0 10px;
            border-radius: 4px;
            cursor: pointer;
          }

          #messages-container {
            display: flex;
            flex-direction: column;
          }

          .user-message, .assistant-message {
            margin-bottom: 16px;
            padding: 12px;
            border-radius: 8px;
            max-width: 85%;
            display: block;
          }

          .user-message {
            align-self: flex-end;
            margin-left: auto;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }

          .assistant-message {
            align-self: flex-start;
            margin-right: auto;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
          }

          .message-header {
            font-weight: bold;
            margin-bottom: 4px;
          }

          .message-content {
            white-space: pre-wrap;
          }

          #loading {
            text-align: center;
            padding: 16px;
            display: none;
          }

          #loading.active {
            display: block;
          }

          /* Code block styling */
          .code-block {
            margin: 12px 0;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
          }

          .code-header {
            background-color: var(--vscode-panel-border);
            color: var(--vscode-foreground);
            padding: 4px 8px;
            font-size: 12px;
            font-weight: bold;
            font-family: var(--vscode-font-family);
            text-transform: uppercase;
          }

          pre {
            background-color: var(--vscode-editor-background);
            padding: 12px;
            overflow-x: auto;
            margin: 0;
            max-height: 400px;
          }

          code {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            background-color: var(--vscode-editor-lineHighlightBackground);
            padding: 2px 4px;
            border-radius: 3px;
          }

          pre code {
            background-color: transparent;
            padding: 0;
            border-radius: 0;
            display: block;
            white-space: pre;
            line-height: 1.5;
          }

          #debug {
            position: fixed;
            top: 0;
            right: 0;
            background: rgba(255,0,0,0.1);
            padding: 2px;
            font-size: 10px;
            z-index: 1000;
            display: none; /* Hide in production */
          }
        </style>
      </head>
      <body>
        <div id="debug">Debug info</div>

        <div id="chat-container">
          <div id="messages-container">
            ${chatHistoryHtml}
            <div id="loading">AI Assistant is thinking...</div>
          </div>

          <div id="input-container">
            <form id="chat-form">
              <input type="text" id="message-input" placeholder="Type your message here..." autocomplete="off">
              <button type="submit" id="send-button">Send</button>
            </form>
          </div>
        </div>

        <script>
          // Debug element
          const debugInfo = document.getElementById('debug');
          function debug(msg) {
            console.log(msg);
            if (debugInfo) {
              debugInfo.textContent = 'Debug: ' + msg;
            }
          }

          debug('Script started');

          try {
            const vscode = acquireVsCodeApi();
            debug('VS Code API acquired');

            const messagesContainer = document.getElementById('messages-container');
            const messageInput = document.getElementById('message-input');
            const chatForm = document.getElementById('chat-form');
            const sendButton = document.getElementById('send-button');
            const loading = document.getElementById('loading');

            debug('Elements found: ' +
                  (messagesContainer ? 'container✓ ' : 'container✗ ') +
                  (messageInput ? 'input✓ ' : 'input✗ ') +
                  (chatForm ? 'form✓ ' : 'form✗ ') +
                  (sendButton ? 'button✓' : 'button✗'));

            // Scroll to bottom of messages
            function scrollToBottom() {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            // Scroll to bottom on initial load
            scrollToBottom();

            // Focus the input field
            messageInput.focus();

            // Send message function
            function sendMessage() {
              const message = messageInput.value.trim();
              if (message) {
                debug('Sending message: ' + message);
                vscode.postMessage({
                  type: 'sendMessage',
                  value: message
                });
                messageInput.value = '';
              }
            }

            // Add event listeners
            chatForm.addEventListener('submit', (e) => {
              debug('Form submitted');
              e.preventDefault();
              sendMessage();
            });

            sendButton.addEventListener('click', () => {
              debug('Send button clicked');
              sendMessage();
            });

            messageInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                debug('Enter key pressed');
                e.preventDefault();
                sendMessage();
              }
            });

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

            debug('Event listeners set up');
          } catch (error) {
            debug('Error: ' + error.message);
          }
        </script>
      </body>
      </html>
    `;
  }

  _formatMessageContent(content) {
    if (!content) return '';

    // First handle code blocks to prevent interference with other formatting
    let formattedContent = content.replace(/```([\w]*)\n([\s\S]*?)```/g, (_, language, code) => {
      // Clean up the language identifier
      language = language.trim();
      // Create a properly formatted code block
      return `<div class="code-block"><div class="code-header">${language || 'code'}</div><pre><code class="language-${language || 'text'}">${this._escapeHtml(code)}</code></pre></div>`;
    });

    // Handle inline code (but not inside already processed code blocks)
    formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle basic markdown formatting
    formattedContent = formattedContent
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Headers (h3 and h4 only, to avoid conflicts with message headers)
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
      // Bullet lists
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
      // Convert line breaks to <br> (but preserve pre blocks)
      .replace(/\n(?!<\/pre>)/g, '<br>');

    // Wrap lists in ul/ol tags
    formattedContent = formattedContent
      .replace(/(<li>.*?<\/li>)\s*<br>/g, '$1')
      .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    return formattedContent;
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

  // Create a status bar item for quick access to the chat panel
  const chatStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  chatStatusBarItem.text = "$(comment) AI Chat";
  chatStatusBarItem.tooltip = "Open AI Chat Panel";
  chatStatusBarItem.command = 'sebguru-assistant.openChatPanel';
  chatStatusBarItem.show();

  // Add the status bar item to subscriptions
  context.subscriptions.push(chatStatusBarItem);

  // Show a welcome message with instructions on first activation
  const showWelcomeMessage = () => {
    const message = "SebGuru Assistant is active! Click the AI Chat button in the status bar or use Cmd+Shift+C to open the chat panel.";
    vscode.window.showInformationMessage(message, "Open Chat Panel").then(selection => {
      if (selection === "Open Chat Panel") {
        vscode.commands.executeCommand('sebguru-assistant.openChatPanel');
      }
    });
  };

  // Show welcome message after a short delay
  setTimeout(showWelcomeMessage, 1500);

  // Add a command to open the chat in a panel instead of the sidebar
  context.subscriptions.push(
    vscode.commands.registerCommand('sebguru-assistant.openChatPanel', async () => {
      // Create a webview panel for the chat
      const panel = vscode.window.createWebviewPanel(
        'chatPanel',
        'SebGuru Chat',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      // Initialize chat history
      let chatHistory = [];

      // Set the HTML content
      function updatePanelContent() {
        // Create chat history HTML with markdown formatting
        const chatHistoryHtml = chatHistory.map(message => {
          const isUser = message.role === 'user';
          // Format the message content with markdown
          const formattedContent = formatMessageContent(message.content);
          return `
            <div class="${isUser ? 'user-message' : 'assistant-message'}">
              <div class="message-header">${isUser ? 'You' : 'AI Assistant'}</div>
              <div class="message-content">${formattedContent}</div>
            </div>
          `;
        }).join('');

        // Helper function to format message content with markdown
        function formatMessageContent(content) {
          if (!content) return '';

          // First handle code blocks to prevent interference with other formatting
          let formattedContent = content.replace(/```([\w]*)\n([\s\S]*?)```/g, (_, language, code) => {
            // Clean up the language identifier
            language = language.trim();
            // Create a properly formatted code block
            return `<div class="code-block"><div class="code-header">${language || 'code'}</div><pre><code class="language-${language || 'text'}">${escapeHtml(code)}</code></pre></div>`;
          });

          // Handle inline code (but not inside already processed code blocks)
          formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>');

          // Handle basic markdown formatting
          formattedContent = formattedContent
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Headers (h3 and h4 only, to avoid conflicts with message headers)
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
            // Bullet lists
            .replace(/^- (.*?)$/gm, '<li>$1</li>')
            // Numbered lists
            .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
            // Convert line breaks to <br> (but preserve pre blocks)
            .replace(/\n(?!<\/pre>)/g, '<br>');

          // Wrap lists in ul/ol tags
          formattedContent = formattedContent
            .replace(/(<li>.*?<\/li>)\s*<br>/g, '$1')
            .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

          return formattedContent;
        }

        // Helper function to escape HTML
        function escapeHtml(unsafe) {
          return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }

        panel.webview.html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                display: flex;
                flex-direction: column;
                height: 100vh;
              }

              #chat-container {
                display: flex;
                flex-direction: column;
                height: 100vh;
                overflow: hidden;
              }

              #messages-container {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
              }

              #input-container {
                padding: 16px;
                border-top: 1px solid var(--vscode-panel-border);
                background-color: var(--vscode-editor-background);
              }

              #chat-form {
                display: flex;
              }

              #message-input {
                flex: 1;
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 4px;
              }

              #send-button {
                margin-left: 8px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
              }

              .user-message, .assistant-message {
                margin-bottom: 16px;
                padding: 12px;
                border-radius: 8px;
                max-width: 80%;
              }

              .user-message {
                align-self: flex-end;
                margin-left: auto;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
              }

              .assistant-message {
                align-self: flex-start;
                margin-right: auto;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
              }

              .message-header {
                font-weight: bold;
                margin-bottom: 4px;
              }

              .message-content {
                white-space: pre-wrap;
              }

              #loading {
                text-align: center;
                padding: 16px;
                display: none;
              }

              #loading.active {
                display: block;
              }
            </style>
          </head>
          <body>
            <div id="chat-container">
              <div id="messages-container">
                ${chatHistoryHtml}
                <div id="loading">AI Assistant is thinking...</div>
              </div>
              <div id="input-container">
                <form id="chat-form">
                  <input type="text" id="message-input" placeholder="Type your message here..." autocomplete="off">
                  <button type="submit" id="send-button">Send</button>
                </form>
              </div>
            </div>

            <script>
              const vscode = acquireVsCodeApi();
              const messagesContainer = document.getElementById('messages-container');
              const messageInput = document.getElementById('message-input');
              const chatForm = document.getElementById('chat-form');
              const loading = document.getElementById('loading');

              // Scroll to bottom of messages
              function scrollToBottom() {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }

              // Scroll to bottom on initial load
              scrollToBottom();

              // Focus the input field
              messageInput.focus();

              // Send message function
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

              // Add event listeners
              chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendMessage();
              });

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
                } else if (message.type === 'updateChat') {
                  // The extension will handle updating the entire HTML
                  // Just scroll to bottom after update
                  scrollToBottom();
                }
              });
            </script>
          </body>
          </html>
        `;
      }

      // Initial content update
      updatePanelContent();

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(async (data) => {
        if (data.type === 'sendMessage') {
          try {
            const userMessage = data.value;
            chatHistory.push({ role: 'user', content: userMessage });
            updatePanelContent();

            // Show loading indicator
            panel.webview.postMessage({ type: 'setLoading', value: true });

            try {
              console.log('Processing user message:', userMessage);

              // Set a timeout for the request
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000);
              });

              // Get response from LLM with timeout
              console.log('Making request to LLM...');
              const response = await Promise.race([
                client.makeRequest(userMessage, {
                  systemPrompt: `You are SebGuru, an AI coding assistant. Help the user with their coding tasks and questions.

                  When asked to create a Python script or any other code, provide ONLY the complete code without any explanations or markdown formatting.
                  For example, if asked to create a Python script that prints "Hello World", respond with just:

                  print("Hello World")

                  Do not include explanations like "I don't have access to your system" - you are integrated into VS Code
                  and can provide code that the user can copy and paste into their files.

                  Always provide complete, working solutions that directly address the user's request.`,
                }),
                timeoutPromise
              ]);

              console.log('Received response from LLM:', response ? response.substring(0, 100) + '...' : 'null or empty');

              // Handle empty or invalid responses
              if (!response || typeof response !== 'string' || response.trim() === '') {
                throw new Error('Received empty or invalid response from LLM');
              }

              // Add response to chat history
              chatHistory.push({ role: 'assistant', content: response });
              console.log('Added response to chat history');

              // Hide loading indicator and update webview
              panel.webview.postMessage({ type: 'setLoading', value: false });
              console.log('Updating panel content');
              updatePanelContent();
              panel.webview.postMessage({ type: 'updateChat' });
              console.log('Panel content updated');
            } catch (error) {
              console.error('Error getting response from LLM:', error);
              vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
              panel.webview.postMessage({ type: 'setLoading', value: false });

              // Add a message to the chat history indicating the error
              chatHistory.push({
                role: 'assistant',
                content: `I'm sorry, I encountered an error: ${error.message}. Please try again or check the server logs.`
              });
              updatePanelContent();
            }
          } catch (error) {
            vscode.window.showErrorMessage(`AI Assistant error: ${error.message}`);
            panel.webview.postMessage({ type: 'setLoading', value: false });
          }
        }
      });
    }),

    // Add a test command to create a simple webview
    vscode.commands.registerCommand('sebguru-assistant.testWebview', async () => {
      // Create a simple webview panel
      const panel = vscode.window.createWebviewPanel(
        'testWebview',
        'Test Input Field',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );

      // Set the HTML content with a very simple input field
      panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { padding: 20px; font-family: Arial, sans-serif; }
            input { width: 80%; padding: 10px; margin-right: 10px; border: 2px solid blue; }
            button { padding: 10px; background: blue; color: white; border: none; }
            #result { margin-top: 20px; padding: 10px; background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h2>Test Input Field</h2>
          <p>Type something and click Send to test if input works:</p>

          <div style="display: flex; margin-bottom: 20px;">
            <input type="text" id="test-input" placeholder="Type here...">
            <button id="test-button">Send</button>
          </div>

          <div id="result">Messages will appear here</div>

          <script>
            const vscode = acquireVsCodeApi();
            const input = document.getElementById('test-input');
            const button = document.getElementById('test-button');
            const result = document.getElementById('result');

            // Log elements to help debug
            console.log('Input element:', input);
            console.log('Button element:', button);

            // Focus the input field
            input.focus();

            button.addEventListener('click', () => {
              const message = input.value.trim();
              if (message) {
                result.textContent = 'You typed: ' + message;
                vscode.postMessage({
                  type: 'inputMessage',
                  value: message
                });
                input.value = '';
              }
            });

            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                button.click();
              }
            });
          </script>
        </body>
        </html>
      `;

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(message => {
        if (message.type === 'inputMessage') {
          vscode.window.showInformationMessage('You typed: ' + message.value);
        }
      });

      vscode.window.showInformationMessage('Test input field created. Please try typing in it.');
    }),

    // Register other commands
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

    vscode.commands.registerCommand('sebguru-assistant.suggestFeatures', async () => {
      // Get context for feature suggestions
      const contextType = await vscode.window.showQuickPick(
        [
          { label: 'Current Project', description: 'Analyze current project for feature suggestions', value: 'project' },
          { label: 'Selected Code', description: 'Suggest features based on selected code', value: 'selection' },
          { label: 'General Ideas', description: 'Get general feature suggestions', value: 'general' }
        ],
        { placeHolder: 'What kind of feature suggestions would you like?' }
      );

      if (!contextType) {
        return;
      }

      let context = '';
      let prompt = '';
      let systemPrompt = '';

      if (contextType.value === 'project') {
        // Get project information
        try {
          // Show progress indicator
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Analyzing project structure...',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            // Get workspace folders
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
              throw new Error('No workspace folder is open');
            }

            // Get root folder
            const rootFolder = workspaceFolders[0].uri.fsPath;

            // Get package.json if it exists
            let packageJson = null;
            try {
              const packageJsonUri = vscode.Uri.file(`${rootFolder}/package.json`);
              const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
              packageJson = JSON.parse(new TextDecoder().decode(packageJsonContent));
            } catch (error) {
              // No package.json or couldn't parse it
            }

            // Get file list (limit to 50 files to avoid overwhelming the AI)
            const fileList = [];
            const filePattern = new vscode.RelativePattern(rootFolder, '**/*');
            const fileUris = await vscode.workspace.findFiles(filePattern, '**/node_modules/**', 50);

            for (const uri of fileUris) {
              fileList.push(uri.fsPath.replace(rootFolder, ''));
            }

            // Build context
            context = `Project structure:\n${fileList.join('\n')}\n\n`;
            if (packageJson) {
              context += `package.json:\n${JSON.stringify(packageJson, null, 2)}\n\n`;
            }

            progress.report({ increment: 100 });
          });

          prompt = `Based on the following project structure, suggest new features, improvements, or ideas that could enhance this project:\n\n${context}`;
          systemPrompt = `You are an expert software architect and developer. Analyze the provided project structure and suggest valuable features, improvements, or ideas that could enhance the project.
                          Focus on practical, implementable suggestions that would add real value. For each suggestion, provide:
                          1. A clear title
                          2. A brief description of the feature/improvement
                          3. Why it would be valuable
                          4. A basic implementation approach`;
        } catch (error) {
          vscode.window.showErrorMessage(`Error analyzing project: ${error.message}`);
          return;
        }
      } else if (contextType.value === 'selection') {
        // Get selected code
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

        const fileName = editor.document.fileName.split('/').pop();
        context = `Selected code from ${fileName}:\n\n${selectedText}`;
        prompt = `Based on the following code, suggest new features, improvements, or ideas that could enhance this code or the functionality it represents:\n\n${context}`;
        systemPrompt = `You are an expert software developer. Analyze the provided code and suggest valuable features, improvements, or ideas that could enhance it.
                        Focus on practical, implementable suggestions that would add real value. For each suggestion, provide:
                        1. A clear title
                        2. A brief description of the feature/improvement
                        3. Why it would be valuable
                        4. A basic implementation approach`;
      } else {
        // General ideas
        const projectType = await vscode.window.showQuickPick(
          [
            { label: 'Web Application', value: 'web' },
            { label: 'Mobile App', value: 'mobile' },
            { label: 'Desktop Application', value: 'desktop' },
            { label: 'API/Backend Service', value: 'api' },
            { label: 'Data Science/ML Project', value: 'data' },
            { label: 'DevOps/Infrastructure', value: 'devops' },
            { label: 'Other/General', value: 'general' }
          ],
          { placeHolder: 'What type of project are you working on?' }
        );

        if (!projectType) {
          return;
        }

        // Get additional context
        const additionalContext = await vscode.window.showInputBox({
          placeHolder: 'Any specific areas of interest? (optional)',
          prompt: 'Enter any specific areas you want feature suggestions for'
        });

        context = `Project type: ${projectType.label}\nAreas of interest: ${additionalContext || 'General improvements'}`;
        prompt = `Suggest innovative and practical features, improvements, or ideas for a ${projectType.label} project${additionalContext ? ' focusing on ' + additionalContext : ''}.`;
        systemPrompt = `You are an expert software architect with deep knowledge of ${projectType.label} development.
                        Suggest 5-7 innovative yet practical features or improvements that would enhance a ${projectType.label} project.
                        For each suggestion, provide:
                        1. A clear title
                        2. A brief description of the feature/improvement
                        3. Why it would be valuable
                        4. A basic implementation approach
                        5. Potential technologies or libraries to consider`;
      }

      try {
        // Show progress indicator
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Generating feature suggestions...',
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0 });

          // Get suggestions from AI
          const response = await client.makeRequest(prompt, {
            systemPrompt: systemPrompt,
            temperature: 0.7,
            maxTokens: 4096
          });

          progress.report({ increment: 100 });

          // Show results in a new editor
          const document = await vscode.workspace.openTextDocument({
            content: `# Feature Suggestions\n\n${response}`,
            language: 'markdown'
          });

          await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

          return response;
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Error generating feature suggestions: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.modifyFile', async () => {
      // Get file path from user
      const editor = vscode.window.activeTextEditor;
      let filePath;

      if (editor) {
        // Use the current file as default
        filePath = editor.document.uri.fsPath;
      } else {
        // Ask for file path
        filePath = await vscode.window.showInputBox({
          placeHolder: '/path/to/file.ext',
          prompt: 'Enter the path of the file to modify'
        });

        if (!filePath) {
          return;
        }
      }

      // Get modification type from user
      const modificationType = await vscode.window.showQuickPick(
        [
          { label: 'Replace Entire Content', description: 'Replace the entire file content', value: 'replace' },
          { label: 'Modify with AI', description: 'Use AI to modify the file content', value: 'ai' }
        ],
        { placeHolder: 'How do you want to modify the file?' }
      );

      if (!modificationType) {
        return;
      }

      try {
        // Read the current file content
        const fileUri = vscode.Uri.file(filePath);
        const fileContent = new TextDecoder().decode(await vscode.workspace.fs.readFile(fileUri));

        let newContent = '';

        if (modificationType.value === 'replace') {
          // Get new content from user
          newContent = await vscode.window.showInputBox({
            placeHolder: 'New file content...',
            prompt: 'Enter the new content for the file',
            multiline: true,
            value: fileContent
          });

          if (newContent === undefined) {
            return;
          }
        } else if (modificationType.value === 'ai') {
          // Get modification instructions from user
          const instructions = await vscode.window.showInputBox({
            placeHolder: 'Describe how to modify the file...',
            prompt: 'Describe how you want the AI to modify the file'
          });

          if (!instructions) {
            return;
          }

          // Show progress indicator
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Modifying file with AI...',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });

            // Get file extension
            const fileExtension = filePath.split('.').pop() || '';

            // Generate modified content using AI
            newContent = await client.makeRequestWithFileContext(
              `Modify this ${fileExtension} file according to these instructions: ${instructions}`,
              fileContent,
              filePath.split('/').pop(),
              {
                systemPrompt: `You are an expert programmer. Modify the provided ${fileExtension} file according to the user's instructions.
                               Return the complete modified file content, not just the changes.
                               Do not include markdown code blocks or explanations, just output the raw file content.`,
                temperature: 0.2
              }
            );

            // Clean up the content (remove markdown code blocks if present)
            newContent = newContent.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();

            progress.report({ increment: 100 });
          });
        }

        // Modify the file
        const success = await modifyFile(filePath, newContent);
        if (success) {
          vscode.window.showInformationMessage(`File modified: ${filePath}`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Error modifying file: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.insertCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor');
        return;
      }

      // Get insertion position
      const position = editor.selection.active;
      const filePath = editor.document.uri.fsPath;

      // Get code source
      const codeSource = await vscode.window.showQuickPick(
        [
          { label: 'Enter Code Manually', description: 'Enter code to insert manually', value: 'manual' },
          { label: 'Generate with AI', description: 'Generate code to insert using AI', value: 'ai' }
        ],
        { placeHolder: 'How do you want to insert code?' }
      );

      if (!codeSource) {
        return;
      }

      let code = '';

      if (codeSource.value === 'manual') {
        // Get code from user
        code = await vscode.window.showInputBox({
          placeHolder: 'Code to insert...',
          prompt: 'Enter the code to insert',
          multiline: true
        });

        if (code === undefined) {
          return;
        }
      } else if (codeSource.value === 'ai') {
        // Get code description from user
        const description = await vscode.window.showInputBox({
          placeHolder: 'Describe the code to generate...',
          prompt: 'Describe the code you want to insert'
        });

        if (!description) {
          return;
        }

        // Show progress indicator
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Generating code to insert...',
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0 });

          // Get file context
          const fileContent = editor.document.getText();
          const fileName = filePath.split('/').pop();
          const fileExtension = fileName.split('.').pop() || '';

          // Generate code using AI
          code = await client.makeRequestWithFileContext(
            `Generate code to insert at the current cursor position based on this description: ${description}
             The code should be compatible with the existing file and should be ready to insert without any modifications.`,
            fileContent,
            fileName,
            {
              systemPrompt: `You are an expert programmer. Generate ${fileExtension} code that can be inserted at the specified position in the file.
                             The code should be compatible with the existing file and follow the same style and conventions.
                             Do not include markdown code blocks or explanations, just output the raw code to insert.`,
              temperature: 0.2
            }
          );

          // Clean up the content (remove markdown code blocks if present)
          code = code.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();

          progress.report({ increment: 100 });
        });
      }

      // Insert the code
      const success = await insertCode(filePath, position, code);
      if (success) {
        vscode.window.showInformationMessage('Code inserted successfully');
      }
    }),

    vscode.commands.registerCommand('sebguru-assistant.testCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor');
        return;
      }

      // Get the code to test
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      const code = selectedText || editor.document.getText();

      if (!code) {
        vscode.window.showInformationMessage('No code to test');
        return;
      }

      // Get file information
      const filePath = editor.document.uri.fsPath;
      const fileName = filePath.split('/').pop();
      const fileExtension = fileName.split('.').pop() || '';

      // Show progress indicator
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating tests...',
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0 });

        try {
          // Generate test code using AI
          const testCode = await client.makeRequestWithFileContext(
            'Generate comprehensive unit tests for this code:',
            code,
            fileName,
            {
              systemPrompt: `You are an expert in test-driven development. Generate comprehensive unit tests for the provided ${fileExtension} code.
                             Include tests for edge cases and error conditions. The tests should be ready to run without any modifications.
                             Use the appropriate testing framework for the language (e.g., Jest for JavaScript, pytest for Python).
                             Do not include markdown code blocks or explanations, just output the raw test code.`,
              temperature: 0.2
            }
          );

          // Clean up the test code (remove markdown code blocks if present)
          const cleanTestCode = testCode.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();

          progress.report({ increment: 50 });

          // Run the tests
          const success = await testCode(code, cleanTestCode, fileExtension);

          if (success) {
            // Show the test code in a new editor
            const document = await vscode.workspace.openTextDocument({
              content: cleanTestCode,
              language: fileExtension
            });

            await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });
          }

          progress.report({ increment: 100 });
        } catch (error) {
          vscode.window.showErrorMessage(`Error testing code: ${error.message}`);
        }
      });
    }),

    vscode.commands.registerCommand('sebguru-assistant.executeCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor');
        return;
      }

      // Get the code to execute
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      const code = selectedText || editor.document.getText();

      if (!code) {
        vscode.window.showInformationMessage('No code to execute');
        return;
      }

      // Get file information
      const filePath = editor.document.uri.fsPath;
      const fileName = filePath.split('/').pop();
      const fileExtension = fileName.split('.').pop() || '';

      try {
        // Execute the code
        const success = await executeCode(code, fileExtension);
        if (success) {
          vscode.window.showInformationMessage('Code execution started in terminal');
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Error executing code: ${error.message}`);
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

/**
 * Modify an existing file with new content
 * @param {string} filePath - The path of the file to modify
 * @param {string} newContent - The new content for the file
 * @returns {Promise<boolean>} - Whether the file was modified successfully
 */
async function modifyFile(filePath, newContent) {
  try {
    // Check if the file exists
    const fileUri = vscode.Uri.file(filePath);
    try {
      await vscode.workspace.fs.stat(fileUri);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Write the new content to the file
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(fileUri, encoder.encode(newContent));

    // Open the file in the editor
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    return true;
  } catch (error) {
    console.error(`Error modifying file ${filePath}:`, error);
    vscode.window.showErrorMessage(`Failed to modify file: ${error.message}`);
    return false;
  }
}

/**
 * Insert code at a specific position in a file
 * @param {string} filePath - The path of the file to modify
 * @param {vscode.Position} position - The position to insert the code
 * @param {string} code - The code to insert
 * @returns {Promise<boolean>} - Whether the code was inserted successfully
 */
async function insertCode(filePath, position, code) {
  try {
    // Check if the file exists
    const fileUri = vscode.Uri.file(filePath);
    try {
      await vscode.workspace.fs.stat(fileUri);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Open the file in the editor
    const document = await vscode.workspace.openTextDocument(fileUri);
    const editor = await vscode.window.showTextDocument(document);

    // Insert the code at the specified position
    await editor.edit(editBuilder => {
      editBuilder.insert(position, code);
    });

    return true;
  } catch (error) {
    console.error(`Error inserting code into ${filePath}:`, error);
    vscode.window.showErrorMessage(`Failed to insert code: ${error.message}`);
    return false;
  }
}

/**
 * Execute code in a terminal
 * @param {string} code - The code to execute
 * @param {string} language - The programming language of the code
 * @returns {Promise<boolean>} - Whether the code was executed successfully
 */
async function executeCode(code, language) {
  try {
    // Create a temporary file for the code
    const tempDir = vscode.workspace.workspaceFolders[0].uri.fsPath + '/.sebguru-temp';
    await createDirectory(tempDir);

    let tempFilePath;
    let command;

    // Determine file extension and execution command based on language
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        tempFilePath = `${tempDir}/temp.js`;
        command = `node "${tempFilePath}"`;
        break;
      case 'typescript':
      case 'ts':
        tempFilePath = `${tempDir}/temp.ts`;
        command = `npx ts-node "${tempFilePath}"`;
        break;
      case 'python':
      case 'py':
        tempFilePath = `${tempDir}/temp.py`;
        command = `python "${tempFilePath}"`;
        break;
      case 'ruby':
      case 'rb':
        tempFilePath = `${tempDir}/temp.rb`;
        command = `ruby "${tempFilePath}"`;
        break;
      case 'shell':
      case 'sh':
      case 'bash':
        tempFilePath = `${tempDir}/temp.sh`;
        command = `bash "${tempFilePath}"`;
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    // Write the code to the temporary file
    await createFile(tempFilePath, code);

    // Create a terminal and run the command
    const terminal = vscode.window.createTerminal('Code Execution');
    terminal.show();
    terminal.sendText(command);

    return true;
  } catch (error) {
    console.error(`Error executing code:`, error);
    vscode.window.showErrorMessage(`Failed to execute code: ${error.message}`);
    return false;
  }
}

/**
 * Run tests for code
 * @param {string} code - The code to test
 * @param {string} testCode - The test code
 * @param {string} language - The programming language of the code
 * @returns {Promise<boolean>} - Whether the tests were run successfully
 */
async function testCode(code, testCode, language) {
  try {
    // Create a temporary directory for the code and tests
    const tempDir = vscode.workspace.workspaceFolders[0].uri.fsPath + '/.sebguru-temp';
    await createDirectory(tempDir);

    let codeFilePath;
    let testFilePath;
    let command;

    // Determine file extensions and test command based on language
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        codeFilePath = `${tempDir}/code.js`;
        testFilePath = `${tempDir}/test.js`;
        command = `cd "${tempDir}" && npx mocha test.js`;
        break;
      case 'typescript':
      case 'ts':
        codeFilePath = `${tempDir}/code.ts`;
        testFilePath = `${tempDir}/test.ts`;
        command = `cd "${tempDir}" && npx mocha -r ts-node/register test.ts`;
        break;
      case 'python':
      case 'py':
        codeFilePath = `${tempDir}/code.py`;
        testFilePath = `${tempDir}/test_code.py`;
        command = `cd "${tempDir}" && python -m unittest test_code.py`;
        break;
      case 'ruby':
      case 'rb':
        codeFilePath = `${tempDir}/code.rb`;
        testFilePath = `${tempDir}/test_code.rb`;
        command = `cd "${tempDir}" && ruby test_code.rb`;
        break;
      default:
        throw new Error(`Unsupported language for testing: ${language}`);
    }

    // Write the code and test code to temporary files
    await createFile(codeFilePath, code);
    await createFile(testFilePath, testCode);

    // Create a terminal and run the test command
    const terminal = vscode.window.createTerminal('Code Testing');
    terminal.show();
    terminal.sendText(command);

    return true;
  } catch (error) {
    console.error(`Error testing code:`, error);
    vscode.window.showErrorMessage(`Failed to test code: ${error.message}`);
    return false;
  }
}

module.exports = {
  activate,
  deactivate,
  createFile,
  createDirectory,
  createStructure,
  modifyFile,
  insertCode,
  executeCode,
  testCode
};
