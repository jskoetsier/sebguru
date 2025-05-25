# SebGuru Assistant Installation Guide

This document provides detailed instructions for installing and configuring the SebGuru Assistant extension for Visual Studio Code.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [From VS Code Marketplace](#from-vs-code-marketplace)
  - [From VSIX File](#from-vsix-file)
  - [From Source Code](#from-source-code)
- [Configuration](#configuration)
  - [Local LLM Setup](#local-llm-setup)
  - [Remote API Setup](#remote-api-setup)
- [Troubleshooting](#troubleshooting)
- [Updating](#updating)
- [Uninstalling](#uninstalling)

## Prerequisites

Before installing SebGuru Assistant, ensure you have:

- **Visual Studio Code**: Version 1.80.0 or higher
- **Node.js and npm**: Required if installing from source
- **Internet Connection**: For installation and (optionally) for remote API usage
- **Local LLM** (Optional): If you plan to use a local LLM server

## Installation Methods

### From VS Code Marketplace

The easiest way to install SebGuru Assistant:

1. Open VS Code
2. Click on the Extensions view icon in the Activity Bar (or press `Ctrl+Shift+X`)
3. Search for "SebGuru Assistant"
4. Click the "Install" button

### From VSIX File

If you have a `.vsix` file of the extension:

1. Open VS Code
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS)
3. Type "Extensions: Install from VSIX" and select it
4. Navigate to the location of your `.vsix` file and select it
5. Click "Install"

### From Source Code

For developers or advanced users who want to install from source:

1. Clone the repository:
   ```bash
   git clone https://github.com/sebguru/sebguru-assistant.git
   ```

2. Navigate to the project directory:
   ```bash
   cd sebguru-assistant
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Package the extension:
   ```bash
   npm run vscode:prepublish
   npx vsce package
   ```

5. Install the generated `.vsix` file using the method described above

## Configuration

After installation, you need to configure SebGuru Assistant based on your preferred AI backend.

### Local LLM Setup

To use a local LLM (default configuration):

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,` on macOS)
2. Search for "SebGuru Assistant"
3. Ensure "Use Local LLM" is checked
4. Configure the following settings:
   - **Local LLM URL**: The URL of your local LLM server (default: `http://localhost:8080`)
   - **Local LLM Path**: The API endpoint path (default: `/v1/chat/completions`)
   - **Model**: Set to "local-model" (default)
   - **Max Tokens**: Maximum tokens to generate in responses (default: 2048)

#### Setting Up Popular Local LLM Servers

**Ollama**:
1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Run a code-specialized model:
   ```bash
   ollama run codellama
   ```
3. Configure SebGuru Assistant with:
   - Local LLM URL: `http://localhost:11434`
   - Local LLM Path: `/api/chat`

**LM Studio**:
1. Install LM Studio from [lmstudio.ai](https://lmstudio.ai/)
2. Download and load a code-specialized model
3. Start the local server and note the URL/port
4. Configure SebGuru Assistant with the appropriate URL and path

**LocalAI**:
1. Follow setup instructions at [localai.io](https://localai.io/)
2. Configure SebGuru Assistant to point to your LocalAI server

### Remote API Setup

To use a remote API:

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,` on macOS)
2. Search for "SebGuru Assistant"
3. Uncheck "Use Local LLM"
4. Configure the following settings:
   - **API Hostname**: The hostname for the API (default: `localhost:3000`)
   - **API Version**: The API version (default: `v1`)
   - **API Key**: Your API key
   - **Model**: Choose an appropriate model
   - **Max Tokens**: Maximum tokens to generate in responses

## Troubleshooting

**Extension Not Working**:
- Check that VS Code is version 1.80.0 or higher
- Verify that the extension is properly installed (it should appear in the Extensions view)
- Restart VS Code

**Local LLM Connection Issues**:
- Ensure your local LLM server is running
- Verify the URL and path are correct in the settings
- Check if your LLM server requires authentication
- Look for error messages in the VS Code Developer Console (Help > Toggle Developer Tools)

**Remote API Connection Issues**:
- Verify your API key is correct
- Check that the API hostname and version are properly configured
- Ensure you have internet connectivity
- Verify the API endpoint is accessible from your network

## Updating

To update SebGuru Assistant:

1. Open VS Code
2. Click on the Extensions view icon in the Activity Bar
3. Look for SebGuru Assistant in your installed extensions
4. If an update is available, you'll see an "Update" button
5. Click "Update" to install the latest version

## Uninstalling

To remove SebGuru Assistant:

1. Open VS Code
2. Click on the Extensions view icon in the Activity Bar
3. Find SebGuru Assistant in your installed extensions
4. Click the gear icon and select "Uninstall"
5. Reload VS Code when prompted
