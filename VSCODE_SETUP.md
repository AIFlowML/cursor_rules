# VS Code Cursor Rules Integration

## 🎥 Watch How Easy It Is!

<!-- TO UPDATE: Drag and drop the video file from assets/cursor.mp4 into this area when editing on GitHub.com -->
<!-- This will generate a GitHub attachment URL that works properly -->

**📹 [Click here to view the demo video](./assets/cursor.mp4)** *(Download and watch locally)*

> **Note**: To properly embed the video on GitHub, the video needs to be uploaded via GitHub's drag-and-drop feature in the web editor. The video file is available in the `assets/` folder for local viewing.

*See the complete installation process in action - it's just a few clicks in VS Code!*

This guide shows you how to easily manage Cursor Rules in VS Code projects.

## 🚀 Quick Setup

### Method 1: Using VS Code Tasks (Recommended)

1. **Open Command Palette**: `Cmd/Ctrl + Shift + P`
2. **Type**: `Tasks: Run Task`
3. **Select**: `📦 Install Cursor Rules`

### Method 2: Manual Terminal

```bash
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash
```

## 📋 Available VS Code Tasks

After installation, you'll have these tasks available:

### 📦 Install Cursor Rules
- **Purpose**: First-time installation of cursor rules
- **When to use**: New projects or projects without cursor rules
- **Command**: `Cmd/Ctrl + Shift + P` → `Tasks: Run Task` → `📦 Install Cursor Rules`

### 🔄 Update Cursor Rules  
- **Purpose**: Update existing cursor rules to latest version
- **When to use**: When you want to get the latest rules
- **Safety**: Only runs if `.cursor/rules` already exists

### 🧠 Smart Cursor Rules Check
- **Purpose**: Intelligent checker that prompts for installation if needed
- **When to use**: Unsure if rules are installed or up to date
- **Features**: 
  - Checks installation status
  - Shows rule count and age
  - Offers installation if missing
  - Warns about outdated rules (>30 days)

### ✅ Check Cursor Rules Status
- **Purpose**: Quick status check without prompts
- **When to use**: Just want to see current status
- **Shows**: Installation status, file count, last update time

### 🚀 Share New Rules
- **Purpose**: Contribute your new rules back to the repository
- **When to use**: After creating custom rules you want to share
- **Requirements**: Write access to the repository

## 🔧 Automatic Setup Ideas

### Option 1: Workspace Settings Reminder
The included `.vscode/settings.json` has helpful defaults and will remind you about cursor rules.

### Option 2: Project Template
Create a project template that includes the `.vscode/tasks.json` file, so every new project has these tasks available.

### Option 3: VS Code Extension
For complete automation, consider creating a VS Code extension that:
- Detects new projects without cursor rules
- Shows a notification with install button
- Automatically runs the check on project open

### Option 4: Shell Alias
Add this to your shell profile (`~/.bashrc`, `~/.zshrc`):

```bash
alias get-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash"
alias check-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/check_cursor_rules.sh | bash"
```

## 🌍 Making Tasks Globally Available on Mac Studio

To have these VS Code tasks available in **every project** on your Mac Studio:

### Option A: Global Shell Aliases (Recommended)

Add these to your `~/.zshrc` file:

```bash
# Cursor Rules Management
alias install-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash"
alias update-cursor-rules="if [ -d '.cursor/rules' ]; then curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash; else echo '❌ No .cursor/rules found. Use install-cursor-rules first.'; fi"
alias check-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/check_cursor_rules.sh | bash"
alias share-cursor-rules="curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor_push.sh | bash"

# Quick project setup
alias setup-project-vscode="mkdir -p .vscode && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/tasks.json > .vscode/tasks.json && curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/settings.json > .vscode/settings.json && echo '✅ VS Code tasks and settings added to project'"
```

Then reload your shell: `source ~/.zshrc`

### Option B: VS Code User Tasks (Global Tasks)

Create a global VS Code tasks file at `~/Library/Application Support/Code/User/tasks.json`:

```json
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
```

### Option C: Project Template Directory

Create a template directory you can copy from:

```bash
# Create template directory
mkdir -p ~/Templates/cursor-project

# Copy the VS Code config
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/tasks.json > ~/Templates/cursor-project/.vscode/tasks.json
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/.vscode/settings.json > ~/Templates/cursor-project/.vscode/settings.json

# Usage: Copy template to new project
alias new-cursor-project="cp -r ~/Templates/cursor-project/.vscode . && echo '✅ VS Code tasks copied. Run: install-cursor-rules'"
```

### Option D: VS Code Extension (Advanced)

Create a simple VS Code extension that adds these commands to the Command Palette globally.

## 🚀 Recommended Setup for Mac Studio

**For maximum convenience, use Option A + Option C:**

1. **Add shell aliases** for command-line usage
2. **Create template directory** for new projects  
3. **Use the global setup alias** to quickly add VS Code tasks to existing projects

```bash
# Add to ~/.zshrc
source <(curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/install-global.sh)
```

This gives you both terminal commands AND the ability to quickly add VS Code tasks to any project!

## 🛡️ Safety Features

All tasks include safety checks:
- ✅ **No overwrites without confirmation**
- ✅ **Backup existing configurations**  
- ✅ **Clear error messages**
- ✅ **Status validation before updates**

## 🎯 Best Practices

1. **New Project**: Use `📦 Install Cursor Rules`
2. **Regular Updates**: Use `🔄 Update Cursor Rules` monthly
3. **Quick Check**: Use `🧠 Smart Cursor Rules Check` when unsure
4. **Contributing**: Use `🚀 Share New Rules` to give back

## 🔍 Troubleshooting

### Task Not Found
- Make sure `.vscode/tasks.json` exists in your project
- Reload VS Code window: `Cmd/Ctrl + Shift + P` → `Developer: Reload Window`

### Installation Fails
- Check internet connection
- Verify you have write permissions in the project directory
- Try the manual terminal method

### Rules Don't Appear in Cursor
- Restart Cursor IDE after installation
- Check that `.cursor/rules/` directory was created
- Verify rule files have `.mdc` extension

## 💡 Pro Tips

- **Keyboard Shortcut**: Assign a shortcut to your most-used task
- **Status Bar**: The status bar color will change to indicate cursor rules projects
- **Auto-Format**: Rules include format-on-save settings for better code quality
- **Team Setup**: Share the `.vscode/` folder in your repo so the whole team gets these tasks 