# SebGuru Assistant

A powerful VS Code extension that brings AI-assisted coding to your development workflow. SebGuru Assistant helps you write, understand, and improve code more efficiently using either a local LLM or a custom API endpoint.

## Key Features

- **AI Chat Interface**: Get instant coding help through a convenient chat panel
- **Code Intelligence**: Explain, improve, document, test, and refactor your code with AI assistance
- **Flexible Configuration**: Use your own local LLM models or connect to custom API endpoints
- **Context-Aware**: The assistant understands your code's language and provides relevant suggestions

## Quick Start

1. **Installation**: Install the extension from the VS Code marketplace or via VSIX
2. **Choose Your AI Backend**:
   - **Local LLM** (Default): Uses your locally running LLM server
   - **Remote API**: Connect to a custom API endpoint

## Configuration Options

### Local LLM Setup

SebGuru Assistant works seamlessly with popular local LLM solutions:

- **Ollama**: `ollama run codellama` (URL: http://localhost:11434, Path: /api/chat)
- **LM Studio**: Run any code-specialized model locally
- **LocalAI**: Self-host your preferred models

Configure your local LLM connection in Settings → SebGuru Assistant.

### Custom API Endpoints

You can connect to different API endpoints:

- **API Hostname**: Change the hostname for the API (default: localhost:3000)
- **API Version**: Specify the API version to use (default: v1)
- **API Key**: Your personal API key

This flexibility allows you to use:
- Custom API deployments
- Self-hosted LLM instances
- Development or staging environments

## Commands

### Code Intelligence
- **AI: Ask AI Assistant** - Ask any coding question
- **AI: Explain Code** - Get detailed explanations of selected code
- **AI: Improve Code** - Receive suggestions for better code
- **AI: Generate Code** - Create code from descriptions
- **AI: Run Workflow** - Execute specialized code workflows

### Project Structure
- **AI: Create File** - Create a new file with optional AI-generated content
- **AI: Create Directory** - Create a new directory
- **AI: Create Project Structure** - Generate complete project structures with templates

## Project Structure Creation

The extension provides powerful tools for creating project structures:

### Built-in Templates

Create complete project structures with a few clicks using built-in templates for:

- **Node.js Projects**: Basic Node.js application with package.json and folder structure
- **React Applications**: React app with components, styles, and configuration
- **Python Projects**: Python project with src/tests directories and setup files

### Custom AI-Generated Structures

Describe the project structure you want in natural language, and the AI will generate it for you:

1. Select "AI: Create Project Structure" from the command palette
2. Enter the base path for your project
3. Choose "Custom" as the project type
4. Describe your desired structure (e.g., "A TypeScript project with Express backend and React frontend")
5. The AI will generate a complete project structure based on your description

### File Content Generation

When creating files, you can:
- Create empty files
- Enter content manually
- Have the AI generate content based on your description

The AI will automatically adapt to the file type based on the extension, generating appropriate content for JavaScript, Python, HTML, CSS, and many other file types.

## Privacy & Security

When using local LLMs, your code never leaves your machine. Cloud mode requires an API key and sends code to the configured API endpoint for processing.

## Requirements

- VS Code 1.80.0+
- For local mode: A running LLM server
- For cloud mode: API key for your chosen service

## Learn More

Visit the GitHub repository for documentation, examples, and community resources.
