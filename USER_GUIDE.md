# SebGuru Assistant User Guide

Welcome to the comprehensive user guide for SebGuru Assistant, your AI-powered coding companion for Visual Studio Code. This guide will walk you through all the features and capabilities of the extension, helping you maximize your productivity.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [AI Chat Interface](#ai-chat-interface)
- [Code Intelligence](#code-intelligence)
  - [Explaining Code](#explaining-code)
  - [Improving Code](#improving-code)
  - [Generating Code](#generating-code)
  - [Running Workflows](#running-workflows)
- [Project Structure Creation](#project-structure-creation)
  - [Creating Files](#creating-files)
  - [Creating Directories](#creating-directories)
  - [Creating Project Structures](#creating-project-structures)
- [Code Modification](#code-modification)
  - [Modifying Files](#modifying-files)
  - [Inserting Code](#inserting-code)
- [Code Testing & Execution](#code-testing--execution)
  - [Testing Code](#testing-code)
  - [Executing Code](#executing-code)
- [Feature Suggestion System](#feature-suggestion-system)
  - [Project-Based Suggestions](#project-based-suggestions)
  - [Code-Based Suggestions](#code-based-suggestions)
  - [General Project Ideas](#general-project-ideas)
- [Tips and Best Practices](#tips-and-best-practices)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Introduction

SebGuru Assistant is a powerful VS Code extension that brings AI-assisted coding to your development workflow. It helps you write, understand, and improve code more efficiently using either a local LLM or a custom API endpoint.

The extension offers several key capabilities:
- AI chat interface for coding assistance
- Code intelligence features (explain, improve, generate)
- Project structure creation tools
- Feature suggestion system
- Agentic workflows for common coding tasks

## Getting Started

After [installing](./INSTALL.md) and configuring the extension, you'll notice a new icon in the Activity Bar (the sidebar). This is your gateway to the SebGuru Assistant.

1. Click on the SebGuru Assistant icon in the Activity Bar
2. You'll see two main views:
   - **Chat**: For direct interaction with the AI assistant
   - **Workflows**: For running predefined AI workflows

All commands are also available through the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) by typing "AI:".

## AI Chat Interface

The chat interface allows you to have a conversation with the AI assistant about coding questions, problems, or ideas.

### Using the Chat Interface

1. Click on the SebGuru Assistant icon in the Activity Bar
2. Select the "Chat" view
3. Type your question or request in the input box at the bottom
4. Press Enter or click the Send button
5. The AI will respond with helpful information, code examples, or suggestions

### Chat Tips

- Be specific in your questions to get more accurate responses
- You can ask follow-up questions to get more details
- Use the "Clear Chat" button to start a fresh conversation
- The chat history is preserved during your VS Code session

### Alternative Chat Access

You can also access the chat functionality through the Command Palette:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
2. Type "AI: Ask AI Assistant"
3. Enter your question when prompted
4. The response will appear in a new editor tab

## Code Intelligence

SebGuru Assistant offers several powerful code intelligence features to help you understand, improve, and generate code.

### Explaining Code

Get detailed explanations of code snippets:

1. Select the code you want to understand in the editor
2. Right-click and select "AI: Explain Code" from the context menu
   - Alternatively, press `Ctrl+Shift+P` and type "AI: Explain Code"
3. The AI will analyze the code and provide a detailed explanation in a new editor tab

The explanation typically includes:
- The purpose of the code
- How it works
- Key components and their functions
- Potential issues or edge cases
- Suggestions for improvement

### Improving Code

Get suggestions to improve your code:

1. Select the code you want to improve in the editor
2. Right-click and select "AI: Improve Code" from the context menu
   - Alternatively, press `Ctrl+Shift+P` and type "AI: Improve Code"
3. The AI will analyze the code and suggest improvements in a new editor tab

Improvements may include:
- Performance optimizations
- Better readability
- Bug fixes
- Modern syntax or patterns
- Best practices for the specific language

### Generating Code

Generate code based on natural language descriptions:

1. Press `Ctrl+Shift+P` and type "AI: Generate Code"
2. Enter a description of the code you want to generate
3. The AI will generate the code based on your description and display it in a new editor tab

Tips for code generation:
- Be specific about the functionality you need
- Mention the programming language if it's not obvious from the context
- Include details about edge cases or specific requirements
- Specify any libraries or frameworks you want to use

### Running Workflows

SebGuru Assistant includes several predefined workflows for common coding tasks:

1. Click on the SebGuru Assistant icon in the Activity Bar
2. Select the "Workflows" view
3. Choose a workflow from the list:
   - **Explain Code**: Get a detailed explanation of selected code
   - **Improve Code**: Get suggestions to improve your code
   - **Generate Tests**: Generate unit tests for your code
   - **Document Code**: Generate documentation for your code
   - **Refactor Code**: Get suggestions for refactoring your code
4. The workflow will run on your selected code and display results in a new editor tab

Alternatively, you can run workflows from the Command Palette:
1. Press `Ctrl+Shift+P` and type "AI: Run Agentic Workflow"
2. Select the workflow you want to run
3. The workflow will run on your selected code

## Project Structure Creation

SebGuru Assistant provides powerful tools for creating project structures, files, and directories.

### Creating Files

Create new files with optional AI-generated content:

1. Press `Ctrl+Shift+P` and type "AI: Create File"
2. Enter the path of the file to create
3. Choose how you want to create the file content:
   - **Empty File**: Create an empty file
   - **Enter Content**: Enter file content manually
   - **Generate with AI**: Generate file content using AI

When generating content with AI:
1. Enter a description of what you want the file to contain
2. The AI will generate appropriate content based on the file type
3. The file will be created and opened in the editor

### Creating Directories

Create new directories:

1. Press `Ctrl+Shift+P` and type "AI: Create Directory"
2. Enter the path of the directory to create
3. The directory will be created in your workspace

### Creating Project Structures

Generate complete project structures:

1. Press `Ctrl+Shift+P` and type "AI: Create Project Structure"
2. Enter the base path for the project structure
3. Choose a project type:
   - **Node.js**: Basic Node.js project
   - **React**: React application
   - **Python**: Python project
   - **Custom**: Define custom structure with AI

For custom project structures:
1. Enter a description of the project structure you want
2. The AI will generate a complete project structure based on your description
3. The structure will be created in your workspace

## Code Modification

SebGuru Assistant provides powerful tools for modifying existing code files.

### Modifying Files

Modify existing files with AI assistance:

1. Press `Ctrl+Shift+P` and type "AI: Modify File"
2. If no file is open, you'll be prompted to enter a file path
3. Choose how you want to modify the file:
   - **Replace Entire Content**: Replace the entire file content with new content
   - **Modify with AI**: Use AI to modify the file based on your instructions

When using AI to modify files:
1. Enter a description of the changes you want to make
2. The AI will analyze the current file content and apply your requested changes
3. The modified file will be opened in the editor for review

Tips for effective file modification:
- Be specific about what you want to change
- Mention specific functions, classes, or sections to modify
- Describe the desired outcome clearly
- For complex changes, consider breaking them into smaller modifications

### Inserting Code

Insert code at the current cursor position:

1. Position your cursor where you want to insert code
2. Press `Ctrl+Shift+P` and type "AI: Insert Code"
3. Choose how you want to insert code:
   - **Enter Code Manually**: Type or paste the code to insert
   - **Generate with AI**: Have the AI generate code based on your description

When generating code with AI:
1. Enter a description of the code you want to insert
2. The AI will analyze the surrounding code for context
3. The generated code will be inserted at the cursor position

Tips for effective code insertion:
- Provide context about what the inserted code should do
- Mention any variables or functions it should interact with
- Specify any imports or dependencies needed
- Indicate the expected input and output

## Code Testing & Execution

SebGuru Assistant allows you to test and execute code directly from the editor.

### Testing Code

Generate and run tests for your code:

1. Select the code you want to test (or the entire file will be used if nothing is selected)
2. Press `Ctrl+Shift+P` and type "AI: Test Code"
3. The AI will:
   - Generate appropriate unit tests for your code
   - Create temporary test files in a `.sebguru-temp` directory
   - Run the tests in a terminal window
   - Show the test code in a new editor tab

The test generation is language-aware and will use the appropriate testing framework:
- JavaScript: Mocha
- TypeScript: Mocha with ts-node
- Python: unittest
- Ruby: Test::Unit

Tips for effective testing:
- Select complete functions or classes for better test generation
- Make sure your code is syntactically correct
- Ensure necessary dependencies are installed for the testing framework
- Review the generated tests and modify as needed

### Executing Code

Run code directly from the editor:

1. Select the code you want to execute (or the entire file will be used if nothing is selected)
2. Press `Ctrl+Shift+P` and type "AI: Execute Code"
3. The code will be:
   - Saved to a temporary file in a `.sebguru-temp` directory
   - Executed in a terminal window with the appropriate runtime

Supported languages and runtimes:
- JavaScript: Node.js
- TypeScript: ts-node
- Python: python
- Ruby: ruby
- Shell scripts: bash

Tips for effective code execution:
- Make sure the necessary runtimes are installed and in your PATH
- For TypeScript, ensure ts-node is installed
- For JavaScript testing, ensure mocha is installed
- Check the terminal output for any errors or results

## Feature Suggestion System

The feature suggestion system helps you enhance your projects by providing AI-powered recommendations.

### Project-Based Suggestions

Get suggestions based on your entire project:

1. Press `Ctrl+Shift+P` and type "AI: Suggest Features"
2. Choose "Current Project" as the context type
3. The AI will analyze your project structure and files
4. Feature suggestions will be displayed in a new editor tab

This analysis includes:
- Examining file organization
- Reviewing package.json and other configuration files
- Identifying patterns and potential enhancement opportunities

### Code-Based Suggestions

Get suggestions based on specific code:

1. Select the code you want to get suggestions for
2. Press `Ctrl+Shift+P` and type "AI: Suggest Features"
3. Choose "Selected Code" as the context type
4. The AI will analyze the selected code
5. Feature suggestions will be displayed in a new editor tab

These suggestions focus on:
- Improvements for the selected functionality
- Extensions and enhancements
- Potential optimizations

### General Project Ideas

Get general feature ideas based on project type:

1. Press `Ctrl+Shift+P` and type "AI: Suggest Features"
2. Choose "General Ideas" as the context type
3. Select your project type (Web, Mobile, Desktop, API/Backend, Data Science, DevOps)
4. Optionally, enter specific areas of interest
5. The AI will generate feature suggestions based on your project type
6. Suggestions will be displayed in a new editor tab

Each feature suggestion includes:
- A clear title
- A detailed description
- Why the feature would be valuable
- How to implement it
- Recommended technologies or libraries

## Tips and Best Practices

### Getting the Best Results

1. **Be Specific**: The more specific your questions or requests, the better the results
2. **Provide Context**: When asking questions, provide relevant context about your project
3. **Iterate**: If the first response isn't exactly what you need, ask follow-up questions
4. **Use the Right Tool**: Choose the appropriate feature for your task:
   - Use Chat for general questions
   - Use Explain Code for understanding code
   - Use Improve Code for getting suggestions
   - Use Generate Code for creating new code
   - Use Workflows for specific coding tasks

### Working with Local LLMs

1. **Choose the Right Model**: For coding tasks, use code-specialized models like CodeLlama
2. **Balance Size and Quality**: Larger models generally provide better results but require more resources
3. **Optimize Settings**: Adjust the max tokens and temperature settings based on your needs
4. **Keep Your LLM Updated**: Regularly update your local LLM to get the best results

## Keyboard Shortcuts

You can create custom keyboard shortcuts for SebGuru Assistant commands:

1. Open VS Code Settings
2. Go to Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
3. Search for the command you want to assign a shortcut to (e.g., "AI: Explain Code")
4. Click on the command and assign your preferred shortcut

## Advanced Usage

### Customizing System Prompts

Advanced users can modify the extension.js file to customize the system prompts used for different commands. This allows you to tailor the AI's behavior to your specific needs.

### Extending Workflows

You can add new workflows by modifying the `workflows` array in the `AIWorkflowsViewProvider` class in extension.js.

### Integration with Other Extensions

SebGuru Assistant works well with other VS Code extensions. Consider using it alongside:
- Git extensions for version control
- Language-specific extensions for better code intelligence
- Testing frameworks for verifying generated code

## Troubleshooting

If you encounter issues with SebGuru Assistant, try these steps:

1. **Check Connection**: Ensure your local LLM server is running or your internet connection is working
2. **Verify Settings**: Double-check your configuration settings
3. **Restart VS Code**: Sometimes a simple restart resolves issues
4. **Check Logs**: Look for error messages in the VS Code Developer Console (Help > Toggle Developer Tools)
5. **Update Extension**: Make sure you're using the latest version of the extension

For more detailed troubleshooting, refer to the [Installation Guide](./INSTALL.md#troubleshooting).
