#!/bin/bash
# check_cursor_rules.sh - Safe Cursor Rules checker and installer
# This script checks if cursor rules are installed and offers to install them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking Cursor Rules status...${NC}"

# Check if .cursor/rules directory exists
if [ -d ".cursor/rules" ]; then
    rule_count=$(find .cursor/rules -name "*.mdc" -o -name "*.md" | wc -l)
    if [ "$rule_count" -gt 0 ]; then
        echo -e "${GREEN}✅ Cursor Rules are installed!${NC}"
        echo -e "${GREEN}   Found $rule_count rule files${NC}"
        
        # Check if rules are older than 30 days
        if [ -n "$(find .cursor/rules -name "*.mdc" -mtime +30 2>/dev/null)" ]; then
            echo -e "${YELLOW}⚠️  Some rules are older than 30 days${NC}"
            echo -e "${YELLOW}   Consider updating with: ${NC}${BLUE}Cmd/Ctrl+Shift+P > Tasks: Run Task > Update Cursor Rules${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  .cursor/rules directory exists but no rules found${NC}"
        install_prompt
    fi
else
    echo -e "${RED}❌ Cursor Rules not installed${NC}"
    install_prompt
fi

function install_prompt() {
    echo ""
    echo -e "${BLUE}📦 To install Cursor Rules:${NC}"
    echo -e "${BLUE}   1. Press ${NC}${YELLOW}Cmd/Ctrl+Shift+P${NC}"
    echo -e "${BLUE}   2. Type ${NC}${YELLOW}Tasks: Run Task${NC}"
    echo -e "${BLUE}   3. Select ${NC}${YELLOW}📦 Install Cursor Rules${NC}"
    echo ""
    echo -e "${BLUE}   Or run: ${NC}${YELLOW}curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash${NC}"
}

# If running interactively, ask user if they want to install
if [ -t 0 ] && [ ! -d ".cursor/rules" ]; then
    echo ""
    read -p "🤔 Would you like to install Cursor Rules now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Installing Cursor Rules...${NC}"
        curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash
    fi
fi 