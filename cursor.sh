#!/bin/bash
# cursor.sh - AIFlowML Cursor Rules Installer
# This script sets up cursor rules for your project with minimal user interaction

set -e  # Exit on error

echo "🚀 Setting up AIFlowML Cursor Rules..."

# Determine OS type
OS="linux"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi

echo "👨‍💻 Detected OS: $OS"

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: $TEMP_DIR"

# Clone the repository
echo "🔄 Cloning the repository..."
git clone --quiet https://github.com/AIFlowML/cursor_rules.git "$TEMP_DIR"
cd "$TEMP_DIR"

# Get the current directory (where the user ran the script)
PROJECT_DIR=$(pwd)
if [ -n "$INIT_CWD" ]; then  # For npm scripts
    PROJECT_DIR="$INIT_CWD"
elif [ -n "$1" ]; then  # If a path is provided as an argument
    PROJECT_DIR="$1"
fi

echo "🎯 Installing to: $PROJECT_DIR"

# Create the .cursor/rules directory if it doesn't exist
mkdir -p "$PROJECT_DIR/.cursor/rules"

# Copy the rules
echo "📋 Copying rules to $PROJECT_DIR/.cursor/rules..."
cp -r .cursor/rules/* "$PROJECT_DIR/.cursor/rules/"

# Copy the .vscode directory
echo "⚙️ Setting up VS Code tasks..."
mkdir -p "$PROJECT_DIR/.vscode"
cp -r .vscode/* "$PROJECT_DIR/.vscode/"

# Update VS Code tasks.json if it already exists
if [ -f "$PROJECT_DIR/.vscode/tasks.json" ]; then
    # Backup existing tasks.json
    cp "$PROJECT_DIR/.vscode/tasks.json" "$PROJECT_DIR/.vscode/tasks.json.bak"
    echo "💾 Backed up existing tasks.json to tasks.json.bak"
    
    # Merge tasks (simplified approach - just replace the file)
    cp .vscode/tasks.json "$PROJECT_DIR/.vscode/tasks.json"
else
    # Just copy our tasks.json
    cp .vscode/tasks.json "$PROJECT_DIR/.vscode/tasks.json"
fi

# Clean up
cd "$PROJECT_DIR"
rm -rf "$TEMP_DIR"
echo "🧹 Cleaned up temporary files"

echo "✅ AIFlowML Cursor Rules installed successfully!"
echo "🔮 Your AI assistant now has access to all the rules."
echo ""
echo "📝 To update rules in the future, run this in VS Code:"
echo "   - Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)"
echo "   - Type 'Tasks: Run Task' and select 'Update Cursor Rules'"
echo ""
echo "Happy coding! 🚀" 