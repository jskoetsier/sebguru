# SebGuru Assistant

AI-assisted coding and agentic workflows powered by local LLMs or SebGuru.

## Installation

### Option 1: Using the build script

1. Make the build script executable:
   ```bash
   chmod +x build-extension.sh
   ```

2. Run the build script:
   ```bash
   ./build-extension.sh
   ```

   This script will:
   - Install dependencies
   - Build the extension
   - Package it as a VSIX file
   - Optionally install the extension
   - Optionally install axios in the extension directory

3. Restart VS Code after installation

### Option 2: Manual installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run esbuild
   ```

3. Package the extension:
   ```bash
   npx @vscode/vsce package
   ```

4. Install the extension:
   ```bash
   code --install-extension sebguru-assistant-0.6.1.vsix
   ```

5. If the chat window doesn't appear, install axios in the extension directory:
   ```bash
   cd ~/.vscode/extensions/sebguru.sebguru-assistant-0.6.1
   npm install axios
   ```

6. Restart VS Code

## Features

- AI Chat interface for interacting with AI assistants
- Code explanation functionality
- Code improvement suggestions
- Code generation from natural language descriptions
- Agentic workflows for common coding tasks
- Project structure creation capabilities
- Feature suggestion system
- Code testing and execution features

## Using the Chat

There are two ways to access the chat functionality:

### Method 1: Chat Panel (Recommended)

Use the chat panel for a better experience with more space:

1. Press `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)
2. Or run the "AI: Open Chat Panel" command from the Command Palette (Ctrl+Shift+P)

The chat panel opens in a separate tab with a full-sized interface that's easier to use.

### Method 2: Sidebar Chat

Access the chat from the sidebar:

1. Click on the SebGuru Assistant icon in the Activity Bar (left sidebar)
2. Select the "Chat" tab

Note: If you experience issues with the sidebar chat (such as the input field not appearing), use the Chat Panel method instead.

## Configuration

- `sebguru-assistant.useLocalLLM`: Use a locally running LLM instead of SebGuru API
- `sebguru-assistant.localLLMUrl`: URL of the locally running LLM server
- `sebguru-assistant.localLLMPath`: API endpoint path for the locally running LLM server
- `sebguru-assistant.apiHostname`: API hostname for SebGuru services
- `sebguru-assistant.apiVersion`: API version for SebGuru services
- `sebguru-assistant.apiKey`: API Key for SebGuru services
- `sebguru-assistant.model`: Model to use for AI assistance
- `sebguru-assistant.maxTokens`: Maximum tokens to generate in responses

## Troubleshooting

If the chat window doesn't appear or doesn't work properly:

1. Try using the Chat Panel instead of the sidebar chat (Ctrl+Shift+C or Cmd+Shift+C)
2. Check if the extension is active in the Extensions view
3. Check the Developer Tools console for errors (Help > Toggle Developer Tools)
4. Make sure axios is installed in the extension directory
5. Try running the "AI: Test Webview" command to test if webviews are working
