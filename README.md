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

### Code Modification
- **AI: Modify File** - Edit existing files with AI assistance
- **AI: Insert Code** - Insert AI-generated code at cursor position

### Code Testing & Execution
- **AI: Test Code** - Generate and run tests for selected code
- **AI: Execute Code** - Run code directly from the editor

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

## Code Modification

The extension provides powerful tools for modifying existing code:

### Modifying Files with AI

Easily modify existing files with AI assistance:

1. Run the "AI: Modify File" command from the command palette
2. Select the file to modify (or uses the current file if one is open)
3. Choose how you want to modify the file:
   - **Replace Entire Content**: Manually enter new content
   - **Modify with AI**: Describe the changes you want to make

When using AI to modify files:
1. Enter a description of the changes you want to make
2. The AI analyzes the current file content and applies your requested changes
3. The modified file is opened in the editor for review

### Inserting Code at Cursor Position

Insert code at the current cursor position:

1. Position your cursor where you want to insert code
2. Run the "AI: Insert Code" command from the command palette
3. Choose how you want to insert code:
   - **Enter Code Manually**: Type or paste the code to insert
   - **Generate with AI**: Have the AI generate code based on your description

When generating code with AI:
1. Enter a description of the code you want to insert
2. The AI analyzes the surrounding code for context
3. The generated code is inserted at the cursor position

## Code Testing & Execution

The extension provides tools for testing and executing code directly from the editor:

### Testing Code

Generate and run tests for your code:

1. Select the code you want to test (or the entire file will be used)
2. Run the "AI: Test Code" command from the command palette
3. The AI will:
   - Generate appropriate unit tests for your code
   - Create temporary test files
   - Run the tests in a terminal window
   - Show the test code in a new editor tab

The test generation is language-aware and will use the appropriate testing framework:
- JavaScript: Mocha
- TypeScript: Mocha with ts-node
- Python: unittest
- Ruby: Test::Unit

### Executing Code

Run code directly from the editor:

1. Select the code you want to execute (or the entire file will be used)
2. Run the "AI: Execute Code" command from the command palette
3. The code will be:
   - Saved to a temporary file
   - Executed in a terminal window with the appropriate runtime

Supported languages:
- JavaScript (Node.js)
- TypeScript (ts-node)
- Python
- Ruby
- Shell scripts (Bash)

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
