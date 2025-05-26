# Change Log

All notable changes to the "SebGuru Assistant" extension will be documented in this file.

## [0.6.2] - 2023-09-05

### Added
- Added support for the "deepseek-r1" model

### Fixed
- Enhanced response format handling for Ollama API
- Added detailed logging of API responses for better debugging
- Improved error handling for unexpected response formats

## [0.6.1] - 2023-09-05

### Fixed
- Updated default local LLM URL from "http://localhost:8080" to "http://127.0.0.1:11434" to fix chat functionality with local LLM servers
- Updated default local LLM API path to "/api/chat" for compatibility with Ollama API
- Changed default model from "local-model" to "deepseek-coder" to match available models
- Modified request payload format for Ollama API compatibility
- Fixed URL construction to prevent double slashes in API endpoints

### Added
- New "Open Chat Panel" command to open chat in a separate panel instead of sidebar
- Keyboard shortcut (Ctrl+Shift+C / Cmd+Shift+C) to quickly open the chat panel
- Test webview command for troubleshooting webview functionality
- Simplified chat interface with improved debugging capabilities

### Changed
- Improved error handling for HTTP requests
- Enhanced logging for API requests to help with troubleshooting

## [0.6.0] - 2023-08-30

### Added
- Direct code writing capabilities:
  - Modify existing files with AI assistance
  - Insert AI-generated code at cursor position
  - Replace entire file content or make targeted changes
- Code testing and execution features:
  - Generate and run unit tests for selected code
  - Execute code directly from the editor
  - Support for multiple languages (JavaScript, TypeScript, Python, Ruby, Shell)
  - Automatic test framework detection based on file type
- Temporary file management for testing and execution
- Terminal integration for running tests and code

## [0.5.0] - 2023-08-25

### Added
- Feature suggestion system:
  - Analyze current project for feature ideas
  - Generate suggestions based on selected code
  - Get general feature ideas for different project types
- Context-aware recommendations:
  - Project structure analysis
  - Code analysis
  - Project type specific suggestions
- Detailed feature proposals with:
  - Clear titles
  - Feature descriptions
  - Value propositions
  - Implementation approaches
  - Technology recommendations

## [0.4.0] - 2023-08-20

### Added
- Project structure creation capabilities:
  - Create files with AI-generated content
  - Create directories
  - Generate complete project structures
- Built-in templates for common project types:
  - Node.js projects
  - React applications
  - Python projects
- Custom project structure generation using AI
- File content generation based on descriptions

## [0.3.0] - 2023-08-15

### Added
- Custom API hostname configuration option
- API version configuration option
- Proper versioning information in package.json
- Publisher and repository information
- More detailed changelog entries

### Changed
- Updated all API endpoints to use configurable domains
- Refreshed UI with new color scheme
- Simplified README with clearer instructions
- Improved configuration options descriptions
- Enhanced error handling for API connectivity issues

### Fixed
- API URL construction for different environments
- Configuration update handling

## [0.2.0] - 2023-08-01

### Added
- Support for local LLM integration
- Configuration options for local LLM server URL and path
- Automatic detection of response formats from different LLM servers
- Improved error handling for local LLM connections
- Documentation for setting up local LLM servers

## [0.1.0] - 2023-07-15

### Added
- Initial release
- AI Chat interface for interacting with AI assistants
- Code explanation functionality
- Code improvement suggestions
- Code generation from natural language descriptions
- Agentic workflows for common coding tasks
- Configuration options for API key, model, and token limits
