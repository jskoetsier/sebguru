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

- **AI: Ask AI Assistant** - Ask any coding question
- **AI: Explain Code** - Get detailed explanations of selected code
- **AI: Improve Code** - Receive suggestions for better code
- **AI: Generate Code** - Create code from descriptions
- **AI: Run Workflow** - Execute specialized code workflows

## Privacy & Security

When using local LLMs, your code never leaves your machine. Cloud mode requires an API key and sends code to the configured API endpoint for processing.

## Requirements

- VS Code 1.80.0+
- For local mode: A running LLM server
- For cloud mode: API key for your chosen service

## Learn More

Visit the GitHub repository for documentation, examples, and community resources.
