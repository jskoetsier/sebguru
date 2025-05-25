# SebGuru Assistant

A powerful VS Code extension that brings AI-assisted coding to your development workflow. SebGuru Assistant helps you write, understand, and improve code more efficiently using either a local LLM or the SebGuru cloud service.

## Key Features

- **AI Chat Interface**: Get instant coding help through a convenient chat panel
- **Code Intelligence**: Explain, improve, document, test, and refactor your code with AI assistance
- **Flexible Configuration**: Use your own local LLM models or connect to SebGuru's cloud service
- **Context-Aware**: The assistant understands your code's language and provides relevant suggestions

## Quick Start

1. **Installation**: Install the extension from the VS Code marketplace or via VSIX
2. **Choose Your AI Backend**:
   - **Local LLM** (Default): Uses your locally running LLM server
   - **SebGuru Cloud**: Connect to SebGuru's optimized code models

## Using Local LLMs

SebGuru Assistant works seamlessly with popular local LLM solutions:

- **Ollama**: `ollama run codellama` (URL: http://localhost:11434, Path: /api/chat)
- **LM Studio**: Run any code-specialized model locally
- **LocalAI**: Self-host your preferred models

Configure your local LLM connection in Settings → SebGuru Assistant.

## Commands

- **AI: Ask AI Assistant** - Ask any coding question
- **AI: Explain Code** - Get detailed explanations of selected code
- **AI: Improve Code** - Receive suggestions for better code
- **AI: Generate Code** - Create code from descriptions
- **AI: Run Workflow** - Execute specialized code workflows

## Privacy & Security

When using local LLMs, your code never leaves your machine. Cloud mode requires a SebGuru API key and sends code to SebGuru's secure processing servers.

## Requirements

- VS Code 1.80.0+
- For local mode: A running LLM server
- For cloud mode: SebGuru API key

## Learn More

Visit [sebguru.ai](https://sebguru.ai) for documentation, API keys, and community resources.
