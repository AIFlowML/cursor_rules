# AIFlowML Cursor Rules

This repository contains a collection of Cursor rules used by AIFlowML for various projects. These rules help ensure consistent coding standards and provide AI assistants with project-specific knowledge.

## 🎥 See It In Action!

https://github.com/user-attachments/assets/bba88f6a-6672-4aa6-a78e-4d74ab0619ec

**📹 [Click here to view the demo video](./assets/cursor.mp4)** _(Download and watch locally)_

> **Note**: To properly embed the video on GitHub, the video needs to be uploaded via GitHub's drag-and-drop feature in the web editor. The video file is available in the `assets/` folder for local viewing.

_Watch how simple it is to install and use cursor rules in your VS Code projects!_

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

### Complete Rules Tree Structure

```
.cursor/rules/
├── 📁 Root Rules (Universal Development)
│   ├── 📋 cursor_rules.mdc               # Meta rules for rule creation and maintenance
│   ├── 🔄 dev_workflow.mdc               # Development workflow and task management
│   ├── 🔧 self_improve.mdc               # Self-improvement patterns for rule evolution
│   ├── 🎯 taskmaster.mdc                 # TaskMaster project management integration
│   └── 🐍 poetry.mdc                     # Python Poetry package management
│
├── 📁 ElizaOS/ (AI Agent Framework - 15 rules)
│   ├── 🏗️ API Integration (3 rules)
│   │   ├── elizaos_v2_api_plugins_core.mdc      # Core plugin architecture and setup
│   │   ├── elizaos_v2_api_client_integration.mdc # HTTP clients and API integration
│   │   └── elizaos_v2_api_llm_providers.mdc      # LLM provider integrations
│   │
│   ├── 🧠 Core Framework (3 rules)
│   │   ├── elizaos_v2_core_runtime.mdc           # AgentRuntime and character config
│   │   ├── elizaos_v2_core_components.mdc        # Actions, Providers, and Evaluators
│   │   └── elizaos_v2_core_memory.mdc             # Memory management and state
│   │
│   ├── 🛠️ CLI & Development (3 rules)
│   │   ├── elizaos_v2_cli_project.mdc            # Project management commands
│   │   ├── elizaos_v2_cli_config.mdc             # Environment and configuration
│   │   └── elizaos_v2_cli_agents.mdc             # Agent lifecycle management
│   │
│   ├── 🔗 Plugin Development (2 rules)
│   │   ├── elizaos_v2_client_plugins.mdc         # Discord, Twitter, Telegram clients
│   │   └── elizaos_v2_onchain_plugins.mdc        # Blockchain and crypto integrations
│   │
│   ├── 🧪 Testing & Quality (3 rules)
│   │   ├── elizaos_v2_testing_unit.mdc           # Unit testing patterns
│   │   ├── elizaos_v2_testing_integration.mdc    # Integration testing workflows
│   │   └── elizaos_v2_testing_e2e.mdc            # End-to-end testing automation
│   │
│   └── 📚 Documentation (1 rule)
│       └── elizaos_v2_docs_architecture.mdc      # Architecture documentation standards
│
├── 📁 AGNO/ (AI Agent Framework - 19 rules)
│   ├── 🏗️ Core Architecture (3 rules)
│   │   ├── AGNO_Core_Agent_Architecture.mdc      # Basic agent structure and patterns
│   │   ├── AGNO_Agent_Parameters.mdc             # Agent configuration and parameters
│   │   └── agno-agent-state.mdc                  # Agent state management
│   │
│   ├── 🧠 Memory & Knowledge (4 rules)
│   │   ├── AGNO_Memory_Management.mdc            # Memory system configuration
│   │   ├── AGNO_Knowledge_Integration.mdc        # Knowledge base integration
│   │   ├── AGNO_Chunking_Strategies.mdc          # Document chunking methods
│   │   └── AGNO_VectorDB_Integration.mdc         # Vector database management
│   │
│   ├── 🔧 Models & Integration (3 rules)
│   │   ├── AGNO_Models_Integration.mdc           # 23+ model provider support
│   │   ├── AGNO_Embedder_Configuration.mdc      # Embedding model configuration
│   │   └── AGNO_Tools_Integration.mdc            # Tool integration patterns
│   │
│   ├── 🎯 Advanced Capabilities (5 rules)
│   │   ├── AGNO_Reasoning_Capabilities.mdc       # Reasoning and logic patterns
│   │   ├── AGNO_Structured_Output.mdc            # Structured data output
│   │   ├── AGNO_Multimodal_Capabilities.mdc      # Image, audio, video processing
│   │   ├── AGNO_Workflows.mdc                    # Complex workflow automation
│   │   └── agno-multimodal.mdc                   # Multimodal agent handling
│   │
│   ├── 👥 Team Development (2 rules)
│   │   ├── AGNO_Team_Modes.mdc                   # Multi-agent team configurations
│   │   └── AGNO_Teams_Implementation.mdc         # Team implementation patterns
│   │
│   └── 💾 Session & Output (2 rules)
│       ├── agno-session-storage.mdc              # Session storage management
│       └── agno-structured-output.mdc            # Structured output handling
│
├── 📁 Python/ (Production Standards - 2 rules)
│   ├── python-production.mdc                     # Production-ready Python practices
│   └── python-testing.mdc                        # Comprehensive testing strategies
│
├── 📁 FastMCP_py/ (Python MCP Framework - 11 rules)
│   ├── 🏗️ Core Architecture (3 rules)
│   │   ├── fastMCP_py-core.mdc                   # Core MCP server implementation
│   │   ├── fastMCP_py-composition.mdc            # Server composition patterns
│   │   └── fastMCP_py-context.mdc                # Context management
│   │
│   ├── 🔧 Tools & Resources (3 rules)
│   │   ├── fastMCP_py-tools.mdc                  # Tool implementation patterns
│   │   ├── fastMCP_py-resources.mdc              # Resource management
│   │   └── fastMCP_py-client.mdc                 # Client implementation
│   │
│   ├── 🛡️ Quality & Reliability (3 rules)
│   │   ├── fastMCP_py-validation.mdc             # Input validation patterns
│   │   ├── fastMCP_py-errors.mdc                 # Error handling strategies
│   │   └── fastMCP_py-performance.mdc            # Performance optimization
│   │
│   └── 🚀 Operations (2 rules)
│       ├── fastMCP_py-testing.mdc                # Testing frameworks and patterns
│       └── fastMCP_py-deployment.mdc             # Production deployment
│
├── 📁 FastMCP_ts/ (TypeScript MCP Framework - 9 rules)
│   ├── 🏗️ Core Implementation (3 rules)
│   │   ├── fastMCP_ts-core.mdc                   # Core TypeScript MCP patterns
│   │   ├── fastMCP_ts-session.mdc                # Session management
│   │   └── fastMCP_ts-content.mdc                # Content handling
│   │
│   ├── 🔧 Tools & Resources (2 rules)
│   │   ├── fastMCP_ts-tools.mdc                  # Tool implementation
│   │   └── fastMCP_ts-resources.mdc              # Resource management
│   │
│   ├── 🛠️ Development Tools (2 rules)
│   │   ├── fastMCP_ts-cli.mdc                    # CLI tooling
│   │   └── fastMCP_ts-logging.mdc                # Logging implementation
│   │
│   └── 🛡️ Quality Assurance (2 rules)
│       ├── fastMCP_ts-errors.mdc                 # Error handling patterns
│       └── fastMCP_ts-testing.mdc                # Testing strategies
│
└── 📁 DSPy/ (AI Programming Framework - 50+ rules)
    ├── 🎯 Foundation & Philosophy (2 rules)
    │   ├── 00_DSPy_Intro_and_Philosophy.mdc      # Programming over prompting paradigm
    │   └── 00_DSPy_Core_Workflow.mdc             # Development lifecycle and workflow
    │
    ├── 🧩 Core Modules & Signatures (8 rules)
    │   ├── 01_DSPy_Signatures.mdc                # Input/output specifications
    │   ├── 01_DSPy_Signatures_Custom.mdc         # Advanced signature patterns
    │   ├── 01_DSPy_Modules_Overview.mdc          # Module architecture overview
    │   ├── 01_DSPy_Module_Predict.mdc            # Basic prediction module
    │   ├── 01_DSPy_Module_ChainOfThought.mdc     # Reasoning with CoT
    │   ├── 01_DSPy_Module_ProgramOfThought.mdc   # Code generation and execution
    │   ├── 01_DSPy_Module_ReAct_and_Tools.mdc    # Tool-using agents
    │   └── 01_DSPy_Composing_Modules.mdc         # Complex program composition
    │
    ├── 🔧 Language Models & Configuration (4 rules)
    │   ├── 02_DSPy_LM_Configuration.mdc          # Model setup and configuration
    │   ├── 02_DSPy_LM_Best_Practices.mdc         # LM optimization patterns
    │   ├── 09_DSPY_LiteLLM_Models.mdc            # 100+ LLM providers via LiteLLM
    │   └── 03_DSPy_Data_Handling.mdc             # Data processing and management
    │
    ├── 🔍 Retrieval & Knowledge (2 rules)
    │   ├── 03_DSPy_Retrieval_Overview.mdc        # RAG and retrieval patterns
    │   └── 03_DSPy_Retrieval_Clients.mdc         # Vector DB and search clients
    │
    ├── ⚡ Optimization & Compilation (4 rules)
    │   ├── 04_DSPy_Optimizers_Overview.mdc       # Optimization strategies
    │   ├── 04_DSPy_BootstrapFewShot.mdc          # Few-shot learning optimization
    │   ├── 04_DSPy_Advanced_Optimizers.mdc       # Advanced optimization techniques
    │   └── 04_DSPy_Signature_Optimizers.mdc      # Signature-level optimization
    │
    ├── 📊 Evaluation & Metrics (4 rules)
    │   ├── 05_DSPy_Evaluation_Workflow.mdc       # Evaluation best practices
    │   ├── 05_DSPy_Standard_Metrics.mdc          # Built-in evaluation metrics
    │   ├── 05_DSPy_Custom_Metrics.mdc            # Custom metric development
    │   └── 05_DSPy_Tracing_and_Debugging.mdc     # Debugging and introspection
    │
    ├── 🚀 Production & Performance (5 rules)
    │   ├── 06_DSPy_Program_IO.mdc                # Saving and loading programs
    │   ├── 06_DSPy_Caching_and_Performance.mdc   # Performance optimization
    │   ├── 06_DSPy_Typed_Predictors.mdc          # Type-safe predictions
    │   ├── 06_DSPy_Schema_Enforcement.mdc        # Output validation and correction
    │   └── 07_DSPy_Production_Best_Practices.mdc # MLOps and deployment
    │
    ├── 🎯 Complete Examples (4 rules)
    │   ├── 08_DSPy_Example_Basic_RAG.mdc         # Simple RAG implementation
    │   ├── 08_DSPy_Example_MultiHop_RAG.mdc      # Complex multi-step RAG
    │   ├── 08_DSPy_Example_Agent_with_Tools.mdc  # Tool-using agent example
    │   └── 08_DSPy_Example_Structured_Summarization.mdc # Structured output example
    │
    └── 📚 Advanced Examples (17 rules)
        ├── 🔧 Core Patterns (6 rules)
        │   ├── 001_dspy_basic_rag.mdc            # Foundational RAG patterns
        │   ├── 002_dspy_multihop_search.mdc      # Multi-step reasoning
        │   ├── 003_dspy_program_of_thought.mdc   # Code generation examples
        │   ├── 004_dspy_classification_and_finetuning.mdc # Model fine-tuning
        │   ├── 005_dspy_entity_extraction.mdc    # Information extraction
        │   └── 006_dspy_saving_and_loading_programs.mdc # Program persistence
        │
        ├── ⚡ Performance & Optimization (4 rules)
        │   ├── 007_dspy_caching_for_performance.mdc # Caching strategies
        │   ├── 008_dspy_output_refinement.mdc    # Quality improvement techniques
        │   ├── 009_dspy_optimizer_tracking.mdc   # MLflow integration
        │   └── 010_dspy_optimizing_an_ai_program.mdc # End-to-end optimization
        │
        ├── 🤖 Agentic Systems (3 rules)
        │   ├── 011_dspy_tool_use_react.mdc       # Dynamic tool-using agents
        │   ├── 012_dspy_agent_customer_service.mdc # Customer service automation
        │   └── 013_dspy_agentic_game_playing.mdc # Game-playing agents
        │
        ├── 🔄 Advanced I/O (2 rules)
        │   ├── 014_dspy_streaming_responses.mdc  # Real-time streaming
        │   └── 015_dspy_async_operations.mdc     # Asynchronous processing
        │
        └── 🎨 Multimodal (2 rules)
            ├── 016_dspy_image_generation_prompting.mdc # Image generation
            └── 017_dspy_audio_processing.mdc     # Audio processing
```

## Rule Categories Detailed

### 🏗️ ElizaOS v2 Framework (15 rules)

**Complete AI agent development framework** for building social media bots and conversational AI:

- **API Integration**: HTTP clients, authentication, rate limiting, LLM provider integrations
- **Core Framework**: AgentRuntime setup, component architecture, memory management
- **CLI Tools**: Project management, environment configuration, agent lifecycle
- **Plugin Development**: Social media clients (Discord, Twitter, Telegram), blockchain integrations
- **Testing**: Unit, integration, and end-to-end testing patterns
- **Documentation**: Architecture documentation and best practices

### 🧠 AGNO Framework (19 rules)

**Lightweight AI agent framework** with memory, knowledge, and reasoning capabilities:

- **Core Architecture**: Agent structure, parameters, state management
- **Memory & Knowledge**: Memory systems, knowledge integration, vector databases, chunking
- **Models**: Support for 23+ model providers, embedding configuration, tool integration
- **Advanced Features**: Reasoning, structured output, multimodal capabilities, workflows
- **Team Development**: Multi-agent systems and team coordination
- **Session Management**: Session storage and structured output handling

### 🐍 Python Development (2 rules)

**Production-ready Python development** standards and practices:

- **Production Standards**: Type safety, error handling, configuration management, security
- **Testing Strategies**: Unit, integration, mock vs real data, testing loops

### 🔧 FastMCP Frameworks (20 rules)

**Model Context Protocol (MCP) server development** in Python and TypeScript:

**Python FastMCP (11 rules)**:

- Core server implementation, composition patterns, context management
- Tool and resource implementation, client development
- Validation, error handling, performance optimization
- Testing frameworks and production deployment

**TypeScript FastMCP (9 rules)**:

- Core TypeScript patterns, session and content management
- Tool and resource implementation
- CLI tooling and logging systems
- Error handling and testing strategies

### 🧠 DSPy Framework (50+ rules)

**AI Programming Framework** that replaces prompting with programming for LLM applications:

- **Foundation**: Programming over prompting paradigm, development lifecycle
- **Core Modules**: Signatures, predictors, chain-of-thought, program-of-thought, ReAct agents
- **Language Models**: Configuration, optimization, 100+ LLM providers via LiteLLM
- **Retrieval & RAG**: Vector databases, search clients, multi-hop reasoning
- **Optimization**: Few-shot learning, advanced optimizers, signature optimization
- **Evaluation**: Metrics, debugging, tracing, custom evaluation workflows
- **Production**: Caching, performance, type safety, schema enforcement, MLOps
- **Examples**: Complete implementations for RAG, agents, summarization, classification
- **Advanced Patterns**: Streaming, async operations, multimodal processing, agentic systems

### 🛠️ Development Workflow (5 rules)

**Universal development practices** applicable across all projects:

- **Rule Management**: Meta rules for creating and maintaining cursor rules
- **Workflow**: Task management, development process, TaskMaster integration
- **Self-Improvement**: Pattern recognition and rule evolution
- **Package Management**: Python Poetry configuration and best practices

## Usage by Framework

### For ElizaOS Development

```bash
# Focus on ElizaOS rules for agent development
curl -s https://raw.githubusercontent.com/AIFlowML/cursor_rules/main/cursor.sh | bash
# Use elizaos_v2_* rules for comprehensive agent development
```

### For AGNO Development

```bash
# Use AGNO_* rules for lightweight agent development
# Perfect for research and prototyping AI agents
```

### For FastMCP Development

```bash
# Use fastMCP_py-* for Python MCP servers
# Use fastMCP_ts-* for TypeScript MCP servers
```

### For DSPy Development

```bash
# Use DSPy rules for AI programming with LLMs
# Perfect for building reliable LLM applications with optimization
# Covers everything from basic modules to production deployment
```

### For General Python Development

```bash
# Use python-* rules for production-ready Python applications
# Use poetry.mdc for package management
```

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

````markdown
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
````

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
```
