# AIFlowML Cursor Rules

This repository contains a collection of Cursor rules used by AIFlowML for various projects. These rules help ensure consistent coding standards and provide AI assistants with project-specific knowledge.

## One-Command Installation

Set up cursor rules in your project with a single command:

```bash
# Using curl
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash

# Using wget
wget -qO- https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash
```

This will:
1. Copy all rules to your project's `.cursor/rules` directory
2. Set up VS Code tasks for managing the rules
3. Preserve any existing VS Code configuration

## Contributing New Rules

After creating new rules in your project, you can easily contribute them back:

```bash
# Using curl
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor_push.sh | bash

# Using wget
wget -qO- https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor_push.sh | bash
```

This will:
1. Detect new or modified rules in your `.cursor/rules` directory
2. Push them to a new branch in the shared repository
3. Provide a link to create a pull request

## What Are Cursor Rules?

Cursor rules are instructions for the AI assistant in Cursor IDE that help it understand your codebase better. They provide context, conventions, and best practices specific to your project or technology stack.

## Available Rules

- **AGNO Framework Rules**: Rules for working with the AGNO agent framework
- **Python Best Practices**: Production-ready Python coding standards
- **Testing Guidelines**: Comprehensive testing approaches

## Updating Rules

After installation, you can update the rules using VS Code tasks:
1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Tasks: Run Task" and select "Update Cursor Rules"

Alternatively, run the installation script again to get the latest version.

## Manual Installation

If you prefer to install manually:

```bash
# Clone this repository
git clone git@github.com:AIFlowML/cursor_rules.git

# Copy the rules to your project
mkdir -p /path/to/your/project/.cursor/rules
cp -r cursor_rules/.cursor/rules/* /path/to/your/project/.cursor/rules/

# Copy VS Code tasks (optional)
mkdir -p /path/to/your/project/.vscode
cp -r cursor_rules/.vscode/* /path/to/your/project/.vscode/
```

## Creating Your Own Rules

Cursor rules are stored in `.mdc` files in the `.cursor/rules` directory. Each rule should:

1. Have a descriptive filename
2. Contain clear instructions for the AI assistant
3. Include examples where helpful

Example rule structure:

```markdown
# Rule Name

## Overview
Brief description of what this rule is for.

## Guidelines
- Guideline 1
- Guideline 2

## Examples
```code
// Example code
```
```

## Workflow

The recommended workflow for using these rules:

1. **Install rules** in your project: `curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash`
2. **Create new rules** specific to your project in `.cursor/rules/`
3. **Share your rules** with the team: `curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor_push.sh | bash`
4. **Update regularly** using the VS Code task or installation script

## Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b my-new-rule`)
3. Add your rule to `.cursor/rules/`
4. Commit your changes (`git commit -am 'Add new rule'`)
5. Push to the branch (`git push origin my-new-rule`)
6. Create a new Pull Request

## License

MIT 