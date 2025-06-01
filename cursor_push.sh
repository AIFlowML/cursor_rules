#!/bin/bash
# cursor_push.sh - AIFlowML Cursor Rules Uploader
# This script detects new rules in your project and pushes them to the shared repository

set -e  # Exit on error

echo "🔍 Scanning for new Cursor rules to share..."

# Determine current directory
PROJECT_DIR=$(pwd)
if [ -n "$1" ]; then  # If a path is provided as an argument
    PROJECT_DIR="$1"
fi

# Check if .cursor/rules exists
if [ ! -d "$PROJECT_DIR/.cursor/rules" ]; then
    echo "❌ Error: No .cursor/rules directory found in $PROJECT_DIR"
    echo "Run the installation script first: curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash"
    exit 1
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: $TEMP_DIR"

# Clone the repository
echo "🔄 Cloning the repository..."
git clone --quiet git@github.com:AIFlowML/cursor_rules.git "$TEMP_DIR"
cd "$TEMP_DIR"

# Create a new branch with timestamp
BRANCH_NAME="new-rules-$(date +%Y%m%d%H%M%S)"
git checkout -b "$BRANCH_NAME"

# Check for new rules
echo "🔍 Checking for new rules..."
NEW_RULES_FOUND=false
NEW_RULES_COUNT=0

# Loop through all .mdc files in the project
for rule_file in "$PROJECT_DIR/.cursor/rules/"*.mdc; do
    if [ -f "$rule_file" ]; then
        filename=$(basename "$rule_file")
        
        # Check if this rule already exists in the repository
        if [ ! -f "$TEMP_DIR/.cursor/rules/$filename" ]; then
            echo "✨ Found new rule: $filename"
            cp "$rule_file" "$TEMP_DIR/.cursor/rules/"
            NEW_RULES_FOUND=true
            ((NEW_RULES_COUNT++))
        else
            # Check if the content is different
            if ! cmp -s "$rule_file" "$TEMP_DIR/.cursor/rules/$filename"; then
                echo "📝 Found updated rule: $filename"
                cp "$rule_file" "$TEMP_DIR/.cursor/rules/"
                NEW_RULES_FOUND=true
                ((NEW_RULES_COUNT++))
            fi
        fi
    fi
done

# If no new rules found, exit
if [ "$NEW_RULES_FOUND" = false ]; then
    echo "✅ No new rules found. Your rules are already up to date."
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Commit and push changes
cd "$TEMP_DIR"
git add .cursor/rules/*.mdc
git commit -m "Add $NEW_RULES_COUNT new/updated rules"

echo "🚀 Pushing new rules to repository..."
git push origin "$BRANCH_NAME"

# Prepare pull request message
PR_URL="https://github.com/AIFlowML/cursor_rules/pull/new/$BRANCH_NAME"
echo ""
echo "✅ Successfully pushed $NEW_RULES_COUNT new/updated rules to branch: $BRANCH_NAME"
echo ""
echo "📣 To complete the process, create a pull request:"
echo "   $PR_URL"
echo ""
echo "Or run this command to open the pull request page in your browser:"
echo "   open '$PR_URL'  # macOS"
echo "   xdg-open '$PR_URL'  # Linux"
echo "   start '$PR_URL'  # Windows"
echo ""

# Clean up
rm -rf "$TEMP_DIR"
echo "🧹 Cleaned up temporary files"
echo ""
echo "Thank you for contributing to AIFlowML Cursor Rules! 🙏" 