#!/bin/bash

# Script to build and package the SebGuru Assistant extension
# This script installs dependencies, builds the extension, and packages it as a VSIX file

# Set error handling
set -e
trap 'echo "Error occurred at line $LINENO. Command: $BASH_COMMAND"' ERR

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
print_message "$YELLOW" "Checking for required tools..."

if ! command_exists npm; then
  print_message "$RED" "Error: npm is not installed. Please install Node.js and npm first."
  exit 1
fi

if ! command_exists node; then
  print_message "$RED" "Error: node is not installed. Please install Node.js first."
  exit 1
fi

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_message "$GREEN" "Building SebGuru Assistant extension..."
print_message "$YELLOW" "Working directory: $(pwd)"

# Install dependencies
print_message "$YELLOW" "Installing dependencies..."
npm install
print_message "$GREEN" "Dependencies installed successfully."

# Build the extension
print_message "$YELLOW" "Building extension with esbuild..."
npm run esbuild
print_message "$GREEN" "Extension built successfully."

# Check if vsce is installed globally, if not install it
if ! command_exists vsce; then
  print_message "$YELLOW" "vsce not found, installing @vscode/vsce..."
  npm install -g @vscode/vsce
fi

# Package the extension
print_message "$YELLOW" "Packaging extension as VSIX..."
vsce package
print_message "$GREEN" "Extension packaged successfully."

# Find the generated VSIX file
VSIX_FILE=$(find . -maxdepth 1 -name "*.vsix" | sort -V | tail -n 1)

if [ -z "$VSIX_FILE" ]; then
  print_message "$RED" "Error: Could not find generated VSIX file."
  exit 1
fi

print_message "$GREEN" "VSIX file created: $VSIX_FILE"

# Check if the code command exists
if command_exists code; then
  # Ask if user wants to install the extension
  read -p "Do you want to install the extension now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_message "$YELLOW" "Installing extension..."
    code --install-extension "$VSIX_FILE"
    print_message "$GREEN" "Extension installed successfully."
    print_message "$YELLOW" "Please restart VS Code for the changes to take effect."
  else
    print_message "$YELLOW" "To install the extension manually, run:"
    print_message "$NC" "code --install-extension $VSIX_FILE"
  fi
else
  print_message "$YELLOW" "The 'code' command was not found. To install the extension manually:"
  print_message "$YELLOW" "1. Open VS Code"
  print_message "$YELLOW" "2. Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)"
  print_message "$YELLOW" "3. Click on the '...' menu in the top-right corner"
  print_message "$YELLOW" "4. Select 'Install from VSIX...'"
  print_message "$YELLOW" "5. Navigate to and select this file: $VSIX_FILE"
fi

# Try to find the extension directory in common locations
print_message "$YELLOW" "Looking for installed extension directory..."

# Common locations for VS Code extensions
POSSIBLE_LOCATIONS=(
  "$HOME/.vscode/extensions"
  "$HOME/.vscode-insiders/extensions"
  "$HOME/Library/Application Support/Code/User/extensions"
  "$HOME/Library/Application Support/Code - Insiders/User/extensions"
  "$HOME/.config/Code/User/extensions"
  "$HOME/.config/Code - Insiders/User/extensions"
)

EXTENSION_DIR=""
for location in "${POSSIBLE_LOCATIONS[@]}"; do
  if [ -d "$location" ]; then
    FOUND_DIR=$(find "$location" -maxdepth 1 -name "sebguru.sebguru-assistant-*" | sort -V | tail -n 1)
    if [ -n "$FOUND_DIR" ]; then
      EXTENSION_DIR="$FOUND_DIR"
      break
    fi
  fi
done

if [ -n "$EXTENSION_DIR" ]; then
  print_message "$GREEN" "Found installed extension at: $EXTENSION_DIR"

  # Ask if user wants to install axios in the extension directory
  read -p "Do you want to install axios in the extension directory? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_message "$YELLOW" "Installing axios in extension directory..."
    (cd "$EXTENSION_DIR" && npm install axios)
    print_message "$GREEN" "axios installed successfully in extension directory."
    print_message "$YELLOW" "Please restart VS Code for the changes to take effect."
  fi
else
  print_message "$YELLOW" "Could not find installed extension directory automatically."
  print_message "$YELLOW" "After installing the extension, you may need to manually install axios in the extension directory:"
  print_message "$YELLOW" "1. Find your VS Code extensions directory (typically ~/.vscode/extensions)"
  print_message "$YELLOW" "2. Navigate to the sebguru.sebguru-assistant-* directory"
  print_message "$YELLOW" "3. Run 'npm install axios' in that directory"
  print_message "$YELLOW" "4. Restart VS Code"
fi

print_message "$GREEN" "Build process completed successfully!"
print_message "$YELLOW" "If the chat window still doesn't appear after restarting VS Code, check the Developer Tools console for errors (Help > Toggle Developer Tools)."
