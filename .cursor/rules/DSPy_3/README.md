# DSPy 3.0.1 Rules - Modern DSPy Development

This folder contains comprehensive, updated rules for DSPy 3.0.1 development with Cursor. These rules reflect the latest architectural patterns, new optimizers (GEPA, SIMBA), and the lightweight LM approach introduced in DSPy 3.0.1.

## Rule Organization

### Foundation Rules (001-020)
**Core concepts, basic modules, and configuration patterns**
- Modern LM interface patterns with `dspy.LM()`
- Enhanced signatures and type system
- Basic composition and configuration

### Optimization Rules (021-040)
**Advanced optimizers and evaluation patterns**
- GEPA (Genetic-Pareto) reflective optimization
- SIMBA stochastic introspective optimization
- Enhanced MIPROv2 and BootstrapFinetune
- Feedback-driven metrics and evaluation

### Agent System Rules (041-060)
**Complex agent architectures and tool integration**
- Enhanced ReAct patterns with multi-tool support
- Privacy-conscious delegation (PAPILLON)
- Multi-agent coordination and memory systems

### Production Rules (061-080)
**Deployment, monitoring, and scaling**
- MLflow integration for observability
- Security and privacy best practices
- Local and cloud deployment patterns

### Examples and Integration (081-100)
**Complete applications and framework integration**
- Real-world implementations
- Framework integration patterns
- Migration guides from older DSPy versions

## Key Features Covered

### New in DSPy 3.0.1
- **Unified LM Interface**: `dspy.LM()` for all providers via LiteLLM
- **GEPA Optimizer**: Reflective prompt evolution with textual feedback
- **SIMBA Optimizer**: Stochastic introspective mini-batch ascent
- **Enhanced Agents**: Improved ReAct with multi-tool support
- **MLflow Integration**: Native observability and experiment tracking
- **Streaming & Async**: `dspy.streamify()` and `dspy.asyncify()`
- **Enhanced Types**: Literal types and complex output structures

### Rule Quality Standards
- **Length**: Maximum 400 lines per rule for focused guidance
- **Structure**: Consistent YAML frontmatter + markdown content
- **Examples**: All code tested with DSPy 3.0.1
- **Patterns**: Clear DO/DON'T examples with explanations
- **Flow Diagrams**: ASCII diagrams showing process flows

## Usage

These rules are designed to be used with Cursor's AI-powered development environment. Each rule provides:

1. **Clear Guidance**: Specific patterns for DSPy 3.0.1 development
2. **Code Examples**: Working examples with best practices
3. **Troubleshooting**: Common pitfalls and solutions
4. **References**: Links to official documentation and tutorials

## Migration from Older Rules

If you're migrating from the older DSPy rules folder, key changes include:

- **LM Configuration**: Use `dspy.LM()` instead of provider-specific clients
- **Optimization**: Prefer GEPA for most tasks, SIMBA for complex agent scenarios
- **Agents**: Use enhanced ReAct patterns with proper tool integration
- **Observability**: Integrate MLflow for production monitoring

## Contributing

Rules follow the established pattern:
- Sequential numbering (001-100)
- Standardized structure and formatting
- Focus on practical, actionable guidance
- Comprehensive examples and troubleshooting

Each rule should help developers build more effective DSPy applications using the latest patterns and capabilities in version 3.0.1.