# VS Code Cursor Rules Integration

## 🎥 Watch How Easy It Is!

![Cursor Rules Demo](./assets/cursor.mp4)

<!-- For GitHub Pages and local viewing -->
<video width="100%" controls>
  <source src="./assets/cursor.mp4" type="video/mp4">
  Your browser does not support the video tag. <a href="./assets/cursor.mp4">Download the demo video</a>.
</video>

[📹 **Click here to watch the demo video**](./assets/cursor.mp4)

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