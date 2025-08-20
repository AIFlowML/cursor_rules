# DSPy 3.0.1 Rule Refresh - Comprehensive Action Plan

## Executive Summary

This plan outlines the systematic refresh of DSPy Cursor rules to align with DSPy 3.0.1's major architectural changes, new optimizers (SIMBA, GEPA), and lightweight LM approach. The project will be executed by multiple specialized sub-agents to create comprehensive, updated rules that reflect the latest DSPy capabilities.

## Key Changes in DSPy 3.0.1 Requiring Rule Updates

### 1. **Lightweight LM Approach**
- New `dspy.LM()` unified interface replacing provider-specific clients
- LiteLLM integration for universal model support
- Simplified configuration patterns
- Built-in caching, retries, and usage tracking

### 2. **Complete Optimizer Suite (14 Total)**
- **GEPA (Genetic-Pareto)**: Reflective prompt evolution using textual feedback
- **SIMBA**: Stochastic introspective mini-batch ascent for complex tasks
- **MIPROv2**: Enhanced instruction optimization with auto-configurations
- **BootstrapFinetune**: Advanced weight optimization for local models
- **BootstrapFewShot/BootstrapRS**: Few-shot learning and random search
- **BetterTogether**: Multi-optimizer composition strategies
- **COPRO**: Coordinate prompt optimization
- **Ensemble**: Multiple model coordination
- **KNN/KNNFewShot**: Nearest neighbor optimization
- **LabeledFewShot**: Supervised few-shot learning
- **InferRules**: Rule-based optimization
- **Avatar**: Persona-based optimization
- **GRPO**: Gradient-based prompt optimization

### 3. **Enhanced Agent Architecture**
- Improved `dspy.ReAct` with multi-tool support
- Better tool timeout handling and error recovery
- Dynamic tool discovery patterns
- Privacy-conscious delegation (PAPILLON)

### 4. **Advanced Features**
- MLflow integration for observability
- Streaming support with `dspy.streamify`
- Async operations with `dspy.asyncify`
- Enhanced type system with Literal types
- Rich feedback metrics for optimization

## Current Rule Analysis

### Strengths to Preserve
- Clear workflow diagrams showing process flows
- Concise code examples with DO/DON'T patterns
- Practical use cases and best practices
- Sequential numbering system for organization

### Areas Requiring Major Updates
- LM configuration patterns (outdated provider-specific approach)
- Optimizer selection and configuration
- Agent implementation patterns
- Tool integration approaches
- Evaluation and metrics patterns
- Production deployment strategies

## Action Plan Structure

### Phase 1: Foundation Rules (Rules 001-020)
**Target Completion**: Week 1
**Sub-agent Assignment**: Core DSPy Agent

#### 001-005: Core Concepts
- 001_DSPy_Philosophy_and_3_0_Changes.mdc
- 002_DSPy_LM_Unified_Interface.mdc  
- 003_DSPy_Signatures_Enhanced.mdc
- 004_DSPy_Modules_Overview.mdc
- 005_DSPy_Program_Structure.mdc

#### 006-010: Core Modules (Complete Coverage)
- 006_DSPy_Predict_Module.mdc
- 007_DSPy_ChainOfThought_Module.mdc
- 008_DSPy_ProgramOfThought_Module.mdc
- 009_DSPy_ReAct_Enhanced.mdc
- 010_DSPy_CodeAct_Module.mdc

#### 011-015: Advanced Modules
- 011_DSPy_BestOfN_Module.mdc
- 012_DSPy_Refine_Module.mdc
- 013_DSPy_MultiChainComparison_Module.mdc
- 014_DSPy_Parallel_Module.mdc
- 015_DSPy_Avatar_Module.mdc

#### 016-020: Signatures and Configuration
- 016_DSPy_Signatures_Complete.mdc
- 017_DSPy_Custom_Signatures.mdc
- 018_DSPy_InputField_OutputField.mdc
- 019_DSPy_Settings_Configuration.mdc
- 020_DSPy_Type_System_Enhanced.mdc

### Phase 2: Complete Optimizer Suite (Rules 021-050)
**Target Completion**: Week 2-3
**Sub-agent Assignment**: Optimization Specialist Agent

#### 021-025: Revolutionary Optimizers
- 021_DSPy_GEPA_Optimizer.mdc
- 022_DSPy_SIMBA_Optimizer.mdc
- 023_DSPy_MIPROv2_Enhanced.mdc
- 024_DSPy_BootstrapFinetune_Advanced.mdc
- 025_DSPy_BetterTogether_Composition.mdc

#### 026-030: Bootstrap Family
- 026_DSPy_BootstrapFewShot_Core.mdc
- 027_DSPy_BootstrapRS_RandomSearch.mdc
- 028_DSPy_BootstrapFewShotWithRandomSearch.mdc
- 029_DSPy_LabeledFewShot_Supervised.mdc
- 030_DSPy_KNNFewShot_Retrieval.mdc

#### 031-035: Specialized Optimizers
- 031_DSPy_COPRO_CoordinatePrompt.mdc
- 032_DSPy_Ensemble_MultiModel.mdc
- 033_DSPy_KNN_NearestNeighbor.mdc
- 034_DSPy_InferRules_RuleBased.mdc
- 035_DSPy_Avatar_PersonaBased.mdc

#### 036-040: Advanced Optimization
- 036_DSPy_GRPO_GradientBased.mdc
- 037_DSPy_SignatureOptimizer.mdc
- 038_DSPy_Optimizer_Selection_Guide.mdc
- 039_DSPy_Optimizer_Composition_Patterns.mdc
- 040_DSPy_Optimization_Workflows.mdc

#### 041-050: Evaluation and Metrics
- 041_DSPy_Metrics_Design_Patterns.mdc
- 042_DSPy_Feedback_Metrics_GEPA.mdc
- 043_DSPy_Evaluation_Frameworks.mdc
- 044_DSPy_LLM_as_Judge_Patterns.mdc
- 045_DSPy_Performance_Tracking.mdc
- 046_DSPy_BestOfN_Refine_Patterns.mdc
- 047_DSPy_Retrieval_Integration.mdc
- 048_DSPy_Tool_Integration_Optimization.mdc
- 049_DSPy_Memory_Management.mdc
- 050_DSPy_Schema_Enforcement.mdc

### Phase 3: Agent Systems (Rules 051-070)
**Target Completion**: Week 3
**Sub-agent Assignment**: Agent Architecture Agent

#### 051-055: Agent Foundations
- 051_DSPy_Agent_Architecture.mdc
- 052_DSPy_ReAct_Advanced_Patterns.mdc
- 053_DSPy_Tool_Use_Patterns.mdc
- 054_DSPy_Multi_Tool_Coordination.mdc
- 055_DSPy_Agent_Memory_Systems.mdc

#### 056-060: Agent Specializations
- 056_DSPy_RAG_Agents.mdc
- 057_DSPy_Search_Agents.mdc
- 058_DSPy_Code_Generation_Agents.mdc
- 059_DSPy_Analysis_Agents.mdc
- 060_DSPy_Customer_Service_Agents.mdc

#### 061-065: Agent Optimization
- 061_DSPy_Agent_Training.mdc
- 062_DSPy_Agent_Evaluation.mdc
- 063_DSPy_Agent_Debugging.mdc
- 064_DSPy_Agent_Performance_Tuning.mdc
- 065_DSPy_Agent_Safety_Patterns.mdc

#### 066-070: Advanced Agent Concepts
- 066_DSPy_Multi_Agent_Systems.mdc
- 067_DSPy_Agent_Delegation.mdc
- 068_DSPy_Privacy_Conscious_Agents.mdc
- 069_DSPy_Agent_Monitoring.mdc
- 070_DSPy_Agent_Deployment.mdc

### Phase 4: Production Systems (Rules 071-090)
**Target Completion**: Week 4
**Sub-agent Assignment**: Production Systems Agent

#### 071-075: Deployment Patterns
- 071_DSPy_Production_Architecture.mdc
- 072_DSPy_Model_Serving.mdc
- 073_DSPy_Local_Model_Deployment.mdc
- 074_DSPy_Cloud_Deployment.mdc
- 075_DSPy_Hybrid_Architectures.mdc

#### 076-080: Observability
- 076_DSPy_MLflow_Integration.mdc
- 077_DSPy_Logging_Strategies.mdc
- 078_DSPy_Performance_Monitoring.mdc
- 079_DSPy_Error_Tracking.mdc
- 080_DSPy_Usage_Analytics.mdc

#### 081-085: Security and Privacy
- 081_DSPy_Security_Best_Practices.mdc
- 082_DSPy_PII_Protection.mdc
- 083_DSPy_Model_Security.mdc
- 084_DSPy_API_Security.mdc
- 085_DSPy_Privacy_Compliance.mdc

#### 086-090: Optimization and Scaling
- 086_DSPy_Cost_Optimization.mdc
- 087_DSPy_Performance_Optimization.mdc
- 088_DSPy_Scaling_Strategies.mdc
- 089_DSPy_Resource_Management.mdc
- 090_DSPy_Production_Monitoring.mdc

### Phase 5: Examples and Integration (Rules 091-100)
**Target Completion**: Week 5
**Sub-agent Assignment**: Examples and Documentation Agent

#### 091-095: Complete Applications
- 091_DSPy_RAG_System_Complete.mdc
- 092_DSPy_Classification_System.mdc
- 093_DSPy_Summarization_Pipeline.mdc
- 094_DSPy_Question_Answering.mdc
- 095_DSPy_Code_Generation_System.mdc

#### 096-100: Integration and Migration
- 096_DSPy_FastAPI_Integration.mdc
- 097_DSPy_Streamlit_Apps.mdc
- 098_DSPy_Testing_Strategies.mdc
- 099_DSPy_Migration_Guide.mdc
- 100_DSPy_Future_Patterns.mdc

## Rule Structure and Standards

### File Format
- **Extension**: `.mdc` (Markdown Cursor)
- **Length**: Maximum 400 lines per rule
- **Structure**: YAML frontmatter + structured content

### Content Template
```markdown
---
description: [Concise description of the rule's purpose]
globs: ["**/*.py", "**/*.ipynb"]
alwaysApply: false
---

> You are an expert in DSPy 3.0.1. [Clear expert statement and focus area]

## [Main Topic] Flow

[ASCII diagram showing the process flow]

## Core [Concept] Patterns

### [Subsection 1]
[Clear explanation with code examples]

```python
#  DO: [Best practice with explanation]
[Good example code]

# L DON'T: [Anti-pattern with explanation]
[Bad example code - commented out]
```

### [Subsection 2]
[Additional patterns and examples]

## Advanced [Topic] Techniques

[More sophisticated patterns and use cases]

## Common Pitfalls and Solutions

[Troubleshooting guide with specific solutions]

## Best Practices Summary

### Key Takeaways
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

## References
- [DSPy Documentation Links]
- [Tutorial References]
- [Research Papers]
```

## Quality Standards

### Technical Accuracy
- All code examples must be tested with DSPy 3.0.1
- Include version-specific patterns and deprecations
- Reference official documentation and tutorials

### Clarity and Usability
- Clear, actionable guidance
- Progressive complexity (basic � advanced)
- Real-world examples and use cases
- Troubleshooting sections

### Consistency
- Uniform formatting and structure
- Consistent terminology and naming
- Cross-references between related rules
- Standardized example patterns

## Sub-Agent Responsibilities

### Core DSPy Agent
- **Focus**: Fundamental concepts, basic modules, configuration
- **Expertise**: DSPy architecture, signatures, basic optimization
- **Deliverables**: Rules 001-020

### Optimization Specialist Agent
- **Focus**: Complete optimizer suite, evaluation, metrics
- **Expertise**: All 14 optimizers (GEPA, SIMBA, MIPROv2, Bootstrap family, COPRO, Ensemble, etc.)
- **Deliverables**: Rules 021-050 (30 rules covering every optimizer individually)

### Agent Architecture Agent
- **Focus**: Complex agent systems, tool integration
- **Expertise**: ReAct, multi-agent systems, tool coordination
- **Deliverables**: Rules 051-070 (20 rules covering all agent patterns)

### Production Systems Agent
- **Focus**: Deployment, monitoring, security
- **Expertise**: MLflow, scaling, production best practices
- **Deliverables**: Rules 071-090 (20 rules covering production deployment)

### Examples and Documentation Agent
- **Focus**: Complete applications, integration patterns
- **Expertise**: Real-world implementations, framework integration
- **Deliverables**: Rules 091-100 (10 rules covering examples and migration)

## Success Metrics

### Coverage
- 100% coverage of DSPy 3.0.1 features
- All major use cases addressed
- Migration paths from older versions

### Quality
- All examples tested and working
- Clear improvement over existing rules
- Comprehensive troubleshooting guidance

### Usability
- Rules can be used independently
- Progressive learning path
- Clear cross-references and organization

## Timeline and Milestones

### Week 1: Foundation (Rules 001-020)
- Core concepts and basic modules
- New LM interface patterns
- Basic composition and configuration

### Week 2-3: Complete Optimizer Suite (Rules 021-050)
- All 14 optimizers with dedicated rules
- GEPA, SIMBA, MIPROv2, Bootstrap family
- COPRO, Ensemble, KNN, InferRules, Avatar, GRPO
- Advanced evaluation and metrics patterns

### Week 3: Agent Systems (Rules 051-070)
- Advanced agent architectures
- Tool integration patterns
- Multi-agent systems and delegation

### Week 4: Production Systems (Rules 071-090)
- Deployment and monitoring
- Security and privacy
- Scaling and optimization

### Week 5: Examples and Integration (Rules 091-100)
- Complete applications
- Framework integration patterns
- Migration guides

## Risk Mitigation

### Technical Risks
- **Version Compatibility**: Test all examples with DSPy 3.0.1
- **Breaking Changes**: Document migration paths clearly
- **Performance**: Include optimization guidelines

### Process Risks
- **Coordination**: Regular sync between sub-agents
- **Quality**: Peer review process for all rules
- **Consistency**: Central style guide and templates

## Success Definition

The project will be considered successful when:

1. **Complete Coverage**: All 100 rules created covering DSPy 3.0.1 features
2. **Quality Standards**: All rules meet the 400-line limit with comprehensive examples
3. **Practical Value**: Rules provide clear, actionable guidance for real-world development
4. **Modern Patterns**: All rules reflect DSPy 3.0.1's latest architectural approaches
5. **User Adoption**: Rules enable developers to build more effective DSPy applications

This comprehensive plan ensures systematic coverage of DSPy 3.0.1's capabilities while maintaining the high quality and practical focus that makes Cursor rules valuable for development workflows.

---

# Phase 2: DSPy 3.0.1 Tutorial Examples Project

## Executive Summary

Building on the success of the 100 core DSPy rules, this phase transforms ALL official DSPy 3.0.1 tutorials into production-ready implementation templates. Each tutorial becomes a complete, deployable system with enterprise-grade features.

## Tutorial Examples Mission

### Scope: Complete Tutorial Coverage
Transform all **37 official DSPy 3.0.1 tutorials** into production-ready rules:

**Source**: `/Users/ilessio/dev-agents/PROJECTS/cursor_rules/docs/dspy/docs/tutorials/`
**Target**: `/Users/ilessio/dev-agents/PROJECTS/cursor_rules/.cursor/rules/DSPy_3_examples/`

### 4-Agent Implementation Strategy

#### Agent 1: Core Applications (Rules 001-010)
**Focus**: Foundation application patterns from tutorials
- RAG, Classification, Entity Extraction, QA, Agents, Customer Service

#### Agent 2: Optimization Examples (Rules 011-020) 
**Focus**: GEPA, RL, and advanced optimization tutorials
- All GEPA applications, RL patterns, Classification finetuning

#### Agent 3: Advanced Patterns (Rules 021-030)
**Focus**: Complex systems and multi-modal tutorials
- Multi-hop reasoning, Code generation, Image generation, Custom modules

#### Agent 4: Production Integration (Rules 031-037)
**Focus**: Operational and deployment tutorials
- Async, Caching, Streaming, Deployment, Observability, Persistence

## Tutorial Transformation Standards

### Production Enhancement Process
1. **Extract Core Implementation**: Pull working code from Jupyter notebooks
2. **Add Enterprise Features**: Error handling, monitoring, security, scaling
3. **Create Deployment Templates**: Docker, Kubernetes, cloud deployment
4. **Include Benchmarks**: Before/after optimization performance data
5. **Add Production Patterns**: Logging, metrics, alerting, compliance

### Success Metrics
- **37 Tutorials Transformed**: Complete coverage of official tutorials
- **Production Ready**: All examples immediately deployable
- **Performance Verified**: Benchmark results from original tutorials
- **Enterprise Grade**: Security, monitoring, scaling built-in

This tutorial examples project complements the 100 core rules by providing complete, working systems that demonstrate DSPy patterns in real applications, enabling instant deployment of production-ready DSPy solutions.