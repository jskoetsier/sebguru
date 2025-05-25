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

### Innovation
- **AI: Suggest Features** - Get AI-powered feature and improvement suggestions

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

## Feature Suggestion System

The extension includes an intelligent feature suggestion system that helps you enhance your projects:

### Context-Aware Suggestions

Get tailored feature suggestions based on different contexts:

1. **Project Analysis**: The AI analyzes your project structure and files to suggest relevant features and improvements
   - Examines file organization
   - Reviews package.json and other configuration files
   - Identifies patterns and potential enhancement opportunities

2. **Code-Based Suggestions**: Select specific code and get targeted feature ideas
   - Suggests improvements for the selected functionality
   - Recommends extensions and enhancements
   - Identifies potential optimizations

3. **General Project Ideas**: Get suggestions based on your project type
   - Web applications
   - Mobile apps
   - Desktop applications
   - API/Backend services
   - Data science projects
   - DevOps/Infrastructure

### Comprehensive Recommendations

Each feature suggestion includes:

- **Clear Title**: Concise name for the feature
- **Description**: Detailed explanation of what the feature does
- **Value Proposition**: Why this feature would benefit your project
- **Implementation Approach**: How to implement the feature
- **Technology Recommendations**: Suggested libraries or tools

### How to Use

1. Run the "AI: Suggest Features" command from the command palette
2. Choose the context type:
   - Current Project: Analyzes your workspace
   - Selected Code: Uses your current selection
   - General Ideas: Based on project type
3. Follow the prompts to provide additional context
4. Review the generated suggestions in a new markdown document

## Privacy & Security

When using local LLMs, your code never leaves your machine. Cloud mode requires an API key and sends code to the configured API endpoint for processing.

## Requirements

- VS Code 1.80.0+
- For local mode: A running LLM server
- For cloud mode: API key for your chosen service

## Learn More

Visit the GitHub repository for documentation, examples, and community resources.
