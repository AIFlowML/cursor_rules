#!/bin/bash
# install-global.sh - Global Cursor Rules setup for Mac Studio
# This script sets up shell aliases and templates for easy cursor rules management

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌍 Setting up Global Cursor Rules for Mac Studio...${NC}"

# Determine shell config file
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    SHELL_CONFIG="$HOME/.profile"
fi

echo -e "${BLUE}📝 Adding aliases to $SHELL_CONFIG${NC}"

# Create backup of shell config
cp "$SHELL_CONFIG" "$SHELL_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

# Add aliases to shell config (only if not already present)
if ! grep -q "# Cursor Rules Management" "$SHELL_CONFIG" 2>/dev/null; then
    cat >> "$SHELL_CONFIG" << 'EOF'

# Cursor Rules Management
alias install-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash"
alias update-cursor-rules="if [ -d '.cursor/rules' ]; then curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash; else echo '❌ No .cursor/rules found. Use install-cursor-rules first.'; fi"
alias check-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/check_cursor_rules.sh | bash"
alias share-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor_push.sh | bash"

# Quick project setup
alias setup-project-vscode="mkdir -p .vscode && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/tasks.json > .vscode/tasks.json && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/settings.json > .vscode/settings.json && echo '✅ VS Code tasks and settings added to project'"
alias new-cursor-project="cp -r ~/Templates/cursor-project/.vscode . 2>/dev/null && echo '✅ VS Code tasks copied. Run: install-cursor-rules' || echo '⚠️ Template not found. Run: setup-cursor-template'"
alias setup-cursor-template="mkdir -p ~/Templates/cursor-project/.vscode && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/tasks.json > ~/Templates/cursor-project/.vscode/tasks.json && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/settings.json > ~/Templates/cursor-project/.vscode/settings.json && echo '✅ Template created at ~/Templates/cursor-project'"

EOF
    echo -e "${GREEN}✅ Shell aliases added${NC}"
else
    echo -e "${YELLOW}⚠️ Aliases already exist, skipping${NC}"
fi

# Create template directory
echo -e "${BLUE}📁 Creating project template...${NC}"
mkdir -p ~/Templates/cursor-project/.vscode

# Download VS Code configuration files
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/tasks.json > ~/Templates/cursor-project/.vscode/tasks.json
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/settings.json > ~/Templates/cursor-project/.vscode/settings.json

echo -e "${GREEN}✅ Template created at ~/Templates/cursor-project${NC}"

# Create global VS Code user tasks
echo -e "${BLUE}⚙️ Setting up global VS Code tasks...${NC}"
VSCODE_USER_DIR="$HOME/Library/Application Support/Code/User"
mkdir -p "$VSCODE_USER_DIR"

# Check if user tasks already exist
if [ -f "$VSCODE_USER_DIR/tasks.json" ]; then
    echo -e "${YELLOW}⚠️ Global VS Code tasks.json already exists${NC}"
    echo -e "${YELLOW}   You can manually add the cursor rules task from the documentation${NC}"
else
    # Create global tasks.json
    cat > "$VSCODE_USER_DIR/tasks.json" << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "🌍 Setup Project with Cursor Rules",
            "type": "shell",
            "command": "mkdir -p .vscode && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/tasks.json > .vscode/tasks.json && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/settings.json > .vscode/settings.json && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash",
            "presentation": {
                "reveal": "always",
                "panel": "new",
                "focus": true
            },
            "group": "build",
            "detail": "Complete project setup: VS Code tasks + Cursor Rules installation"
        }
    ]
}
EOF
    echo -e "${GREEN}✅ Global VS Code task created${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Global setup complete!${NC}"
echo ""
echo -e "${BLUE}Available commands after reloading shell:${NC}"
echo -e "${YELLOW}  install-cursor-rules${NC}     - Install cursor rules in current project"
echo -e "${YELLOW}  update-cursor-rules${NC}      - Update existing cursor rules"
echo -e "${YELLOW}  check-cursor-rules${NC}       - Check status of cursor rules"
echo -e "${YELLOW}  share-cursor-rules${NC}       - Share your rules back to repository"
echo -e "${YELLOW}  setup-project-vscode${NC}     - Add VS Code tasks to current project"
echo -e "${YELLOW}  new-cursor-project${NC}       - Copy template to current project"
echo -e "${YELLOW}  setup-cursor-template${NC}    - Recreate the template directory"
echo ""
echo -e "${BLUE}To activate now: ${NC}${YELLOW}source $SHELL_CONFIG${NC}"
echo -e "${BLUE}Or restart your terminal${NC}"
echo ""
echo -e "${BLUE}VS Code Global Task: ${NC}${YELLOW}Cmd+Shift+P > Tasks: Run Task > 🌍 Setup Project with Cursor Rules${NC}" 