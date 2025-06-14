# DSPy with LiteLLM: Complete Provider Guide

This guide covers how to use various LLM providers with DSPy through LiteLLM integration. DSPy leverages LiteLLM's extensive provider ecosystem, making it easy to work with dozens of different model providers using a unified API.

## 🚀 Quick Start

DSPy uses LiteLLM under the hood, which means you can use any provider supported by LiteLLM with a simple, consistent interface:

```python
import dspy

# Basic pattern: dspy.LM('provider/model-name')
lm = dspy.LM('openai/gpt-4o-mini')
dspy.configure(lm=lm)
```

## 🔑 Authentication Methods

DSPy supports multiple authentication methods for each provider:

1. **Environment Variables** (Recommended)
2. **Direct API Key Parameter**
3. **Configuration Files** (provider-specific)

## 📋 Supported Providers

### 1. OpenAI
**Models**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo, etc.

```python
import os
import dspy

# Method 1: Environment Variable
os.environ['OPENAI_API_KEY'] = 'your-api-key-here'
lm = dspy.LM('openai/gpt-4o-mini')

# Method 2: Direct API Key
lm = dspy.LM('openai/gpt-4o-mini', api_key='your-api-key-here')

# Configure as default
dspy.configure(lm=lm)
```

**Environment Variables:**
- `OPENAI_API_KEY`

### 2. Anthropic (Claude)
**Models**: Claude-3.5-Sonnet, Claude-3-Opus, Claude-3-Haiku, etc.

```python
import dspy

# Environment Variable Method
os.environ['ANTHROPIC_API_KEY'] = 'your-api-key-here'
lm = dspy.LM('anthropic/claude-3-5-sonnet-20241022')

# Direct API Key Method
lm = dspy.LM('anthropic/claude-3-5-sonnet-20241022', api_key='your-api-key-here')

dspy.configure(lm=lm)
```

**Environment Variables:**
- `ANTHROPIC_API_KEY`

### 3. Google (Gemini/Vertex AI)
**Multimodal AI Models** with advanced capabilities:

| Model Variant | Model ID | Input Types | Output Types | Optimized For |
|---------------|----------|-------------|--------------|---------------|
| **Gemini 2.5 Flash Preview** | `gemini-2.5-flash-preview-05-20` | Audio, Images, Video, Text | Text | Adaptive thinking, cost efficiency |
| **Gemini 2.5 Flash Native Audio** | `gemini-2.5-flash-preview-native-audio-dialog` | Audio, Video, Text | Interleaved Text & Audio | High-quality conversational audio |
| **Gemini 2.5 Flash Audio Thinking** | `gemini-2.5-flash-exp-native-audio-thinking-dialog` | Audio, Video, Text | Interleaved Text & Audio | Conversational audio with reasoning |
| **Gemini 2.5 Flash TTS** | `gemini-2.5-flash-preview-tts` | Text | Audio | Low-latency text-to-speech, multi-speaker |
| **Gemini 2.5 Pro Preview** | `gemini-2.5-pro-preview-06-05` | Audio, Images, Video, Text | Text | Advanced reasoning and analysis |
| **Gemini 2.0 Flash** | `gemini-2.0-flash-exp` | Audio, Images, Video, Text | Text | Fast multimodal processing |
| **Gemini 1.5 Pro** | `gemini-1.5-pro` | Audio, Images, Video, Text | Text | Long context, complex reasoning |
| **Gemini 1.5 Flash** | `gemini-1.5-flash` | Audio, Images, Video, Text | Text | Fast, efficient processing |

```python
import dspy

# Google AI Studio (Gemini API)
os.environ['GEMINI_API_KEY'] = 'your-api-key-here'

# Latest multimodal model with adaptive thinking
lm_latest = dspy.LM('gemini/gemini-2.5-flash-preview-05-20')

# Advanced reasoning model
lm_pro = dspy.LM('gemini/gemini-2.5-pro-preview-06-05')

# Fast processing model
lm_fast = dspy.LM('gemini/gemini-2.0-flash-exp')

# Text-to-speech model
lm_tts = dspy.LM('gemini/gemini-2.5-flash-preview-tts')

# Vertex AI (Enterprise)
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'path/to/service-account.json'
os.environ['VERTEXAI_PROJECT'] = 'your-project-id'
os.environ['VERTEXAI_LOCATION'] = 'us-central1'

lm_vertex = dspy.LM('vertex_ai/gemini-2.0-flash')

dspy.configure(lm=lm_latest)  # Set default
```

**Multimodal Usage Examples:**
```python
# Text + Image processing
response = lm_latest([
    {"role": "user", "content": [
        {"type": "text", "text": "Describe this image"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
    ]}
])

# Audio processing (native audio models)
lm_audio = dspy.LM('gemini/gemini-2.5-flash-preview-native-audio-dialog')
# Note: Audio input requires specific formatting - see Google AI documentation
```

**Environment Variables:**
- `GEMINI_API_KEY` (for AI Studio)
- `GOOGLE_APPLICATION_CREDENTIALS` (for Vertex AI)
- `VERTEXAI_PROJECT` (for Vertex AI)
- `VERTEXAI_LOCATION` (for Vertex AI)

**Key Features:**
- **Multimodal Input**: Process text, images, audio, and video simultaneously
- **Native Audio**: Real-time conversational audio with natural speech patterns
- **Adaptive Thinking**: Dynamic reasoning approach for complex problems
- **Long Context**: Handle extensive documents and conversations
- **Enterprise Ready**: Vertex AI integration for production deployments

### 4. Groq
**Production Models** (High speed, quality, and reliability):

| Model ID | Developer | Context Window | Max Completion | Details |
|----------|-----------|----------------|----------------|---------|
| `gemma2-9b-it` | Google | 8,192 tokens | - | Fast inference |
| `meta-llama/llama-guard-4-12b` | Meta | 131,072 tokens | 128 tokens | Safety model |
| `llama-3.3-70b-versatile` | Meta | 128K tokens | 32,768 tokens | Most capable |
| `llama-3.1-8b-instant` | Meta | 128K tokens | 8,192 tokens | Fastest |
| `whisper-large-v3` | OpenAI | - | - | Audio transcription (25MB max) |
| `whisper-large-v3-turbo` | OpenAI | - | - | Fast audio transcription (25MB max) |
| `qwen-qwq-32b` | Alibaba Cloud | 128K tokens | - | Reasoning model |
| `qwen/qwen3-32b` | Alibaba Cloud | 128K tokens | 16,384 tokens | Latest Qwen model |

```python
import dspy

os.environ['GROQ_API_KEY'] = 'your-api-key-here'

# Fast inference for simple tasks
lm_fast = dspy.LM('groq/llama-3.1-8b-instant')

# Most capable model for complex tasks
lm_smart = dspy.LM('groq/llama-3.3-70b-versatile')

# Reasoning model
lm_reasoning = dspy.LM('groq/qwen-qwq-32b')

dspy.configure(lm=lm_fast)  # Set default
```

**Environment Variables:**
- `GROQ_API_KEY`

### 5. Cerebras
**High-Speed Inference Models** (Optimized for ultra-fast token generation):

| Model Name | Model ID | Parameters | Speed | Context Window |
|------------|----------|------------|-------|----------------|
| Llama 4 Scout | `llama-4-scout-17b-16e-instruct` | 109B | ~2,600 tokens/s | - |
| Llama 3.1 8B | `llama3.1-8b` | 8B | ~2,200 tokens/s | - |
| Llama 3.3 70B | `llama-3.3-70b` | 70B | ~2,100 tokens/s | - |
| Qwen 3 32B* | `qwen-3-32b` | 32B | ~2,100 tokens/s | - |
| DeepSeek R1 Distill** | `deepseek-r1-distill-llama-70b` | 70B | ~1,700 tokens/s | - |

*Qwen 3 is a hybrid reasoning model. Use `/no_think` in prompt to disable reasoning mode.  
**DeepSeek R1 Distill is in private preview - contact Cerebras for access.

```python
import dspy

os.environ['CEREBRAS_API_KEY'] = 'your-api-key-here'

# Fastest model for simple tasks
lm_fastest = dspy.LM('cerebras/llama3.1-8b')

# Most capable model
lm_capable = dspy.LM('cerebras/llama-3.3-70b')

# Latest Llama 4 Scout (most advanced)
lm_advanced = dspy.LM('cerebras/llama-4-scout-17b-16e-instruct')

# Reasoning model (use /no_think to disable reasoning)
lm_reasoning = dspy.LM('cerebras/qwen-3-32b')

dspy.configure(lm=lm_fastest)  # Set default
```

**Environment Variables:**
- `CEREBRAS_API_KEY`

### 6. DeepSeek
**Advanced Reasoning Models** with dynamic pricing:

| Model | Model ID | Context Length | Max Output | Features |
|-------|----------|----------------|------------|----------|
| DeepSeek Chat | `deepseek-chat` | 64K tokens | Default: 4K<br>Max: 8K | JSON Output, Function Calling, Chat Prefix |
| DeepSeek Reasoner | `deepseek-reasoner` | 64K tokens | Default: 32K<br>Max: 64K | Advanced reasoning, JSON Output, Function Calling |

**Pricing Features:**
- **Cache Hit Optimization**: Reduced costs for repeated content
- **Time-based Discounts**: 50-75% off during UTC 16:30-00:30
- **Standard Hours**: UTC 00:30-16:30 (full price)
- **Discount Hours**: UTC 16:30-00:30 (50-75% off)

```python
import dspy

os.environ['DEEPSEEK_API_KEY'] = 'your-api-key-here'

# General purpose chat model
lm_chat = dspy.LM('deepseek/deepseek-chat', max_tokens=4000)

# Advanced reasoning model (higher context, better for complex tasks)
lm_reasoner = dspy.LM('deepseek/deepseek-reasoner', max_tokens=32000)

# Configure with JSON output support
lm_json = dspy.LM('deepseek/deepseek-chat', 
                  max_tokens=4000,
                  response_format={"type": "json_object"})

dspy.configure(lm=lm_chat)  # Set default
```

**Environment Variables:**
- `DEEPSEEK_API_KEY`

**Cost Optimization Tips:**
- Use during discount hours (UTC 16:30-00:30) for 50-75% savings
- Leverage cache hits for repeated queries
- Choose `deepseek-chat` for general tasks, `deepseek-reasoner` for complex reasoning

### 7. Databricks
**Models**: Meta-Llama-3.1-70B-Instruct, DBRX-Instruct, etc.

```python
import dspy

# On Databricks platform (automatic authentication)
lm = dspy.LM('databricks/databricks-meta-llama-3-1-70b-instruct')

# External access
os.environ['DATABRICKS_API_KEY'] = 'your-api-key-here'
os.environ['DATABRICKS_API_BASE'] = 'your-workspace-url'
lm = dspy.LM('databricks/databricks-meta-llama-3-1-70b-instruct')

dspy.configure(lm=lm)
```

**Environment Variables:**
- `DATABRICKS_API_KEY`
- `DATABRICKS_API_BASE`

### 8. Azure OpenAI
**Models**: GPT-4o, GPT-4-turbo, GPT-3.5-turbo (deployed models)

```python
import dspy

# Set environment variables
os.environ['AZURE_API_KEY'] = 'your-api-key-here'
os.environ['AZURE_API_BASE'] = 'https://your-resource.openai.azure.com'
os.environ['AZURE_API_VERSION'] = '2024-02-15-preview'

lm = dspy.LM('azure/your-deployment-name')

# Or pass directly
lm = dspy.LM('azure/your-deployment-name', 
             api_key='your-api-key-here',
             api_base='https://your-resource.openai.azure.com',
             api_version='2024-02-15-preview')

dspy.configure(lm=lm)
```

**Environment Variables:**
- `AZURE_API_KEY`
- `AZURE_API_BASE`
- `AZURE_API_VERSION`
- `AZURE_AD_TOKEN` (optional)
- `AZURE_API_TYPE` (optional)

### 9. Together AI
**Models**: Llama-2-70B-Chat, Mixtral-8x7B, etc.

```python
import dspy

os.environ['TOGETHERAI_API_KEY'] = 'your-api-key-here'
lm = dspy.LM('together_ai/togethercomputer/llama-2-70b-chat')

dspy.configure(lm=lm)
```

**Environment Variables:**
- `TOGETHERAI_API_KEY`

### 10. Anyscale
**Models**: Mistral-7B-Instruct, Llama-2-70B-Chat, etc.

```python
import dspy

os.environ['ANYSCALE_API_KEY'] = 'your-api-key-here'
lm = dspy.LM('anyscale/mistralai/Mistral-7B-Instruct-v0.1')

dspy.configure(lm=lm)
```

**Environment Variables:**
- `ANYSCALE_API_KEY`

## 🛠️ Advanced Configuration

### Custom Parameters
You can configure generation parameters for any provider:

```python
lm = dspy.LM('openai/gpt-4o-mini', 
             temperature=0.7,
             max_tokens=2000,
             top_p=0.9,
             stop=None,
             cache=True)  # Caching is enabled by default
```

### Multiple Models
Use different models for different tasks:

```python
import dspy

# Configure different models
fast_lm = dspy.LM('groq/llama-3.1-8b-instant')  # Fast for simple tasks
smart_lm = dspy.LM('anthropic/claude-3-5-sonnet-20241022')  # Smart for complex tasks

# Set default
dspy.configure(lm=fast_lm)

# Use context manager for specific operations
with dspy.context(lm=smart_lm):
    response = complex_reasoning_module(question="Complex question")
```

### Local Models

#### SGLang Server
```python
# First, start SGLang server:
# CUDA_VISIBLE_DEVICES=0 python -m sglang.launch_server --port 7501 --model-path meta-llama/Meta-Llama-3-8B-Instruct

lm = dspy.LM("openai/meta-llama/Meta-Llama-3-8B-Instruct",
             api_base="http://localhost:7501/v1",
             api_key="",
             model_type='chat')
```

#### Ollama
```python
# First, start Ollama:
# ollama run llama3.2:1b

lm = dspy.LM('ollama_chat/llama3.2', 
             api_base='http://localhost:11434', 
             api_key='')
```

## 🔍 Usage Examples

### Basic Usage
```python
import dspy

# Configure your model
lm = dspy.LM('anthropic/claude-3-5-sonnet-20241022')
dspy.configure(lm=lm)

# Direct LM call
response = lm("Explain quantum computing in simple terms")
print(response[0])

# Using DSPy modules
qa = dspy.ChainOfThought('question -> answer')
result = qa(question="What is the capital of France?")
print(result.answer)
```

### Multi-Provider Setup
```python
import dspy

# Define different models for different purposes
models = {
    'fast': dspy.LM('groq/llama-3.1-8b-instant'),
    'smart': dspy.LM('anthropic/claude-3-5-sonnet-20241022'),
    'creative': dspy.LM('openai/gpt-4o'),
    'code': dspy.LM('deepseek/deepseek-coder')
}

# Use appropriate model for each task
def process_query(query_type, question):
    model_map = {
        'simple': models['fast'],
        'complex': models['smart'],
        'creative': models['creative'],
        'coding': models['code']
    }
    
    with dspy.context(lm=model_map[query_type]):
        qa = dspy.ChainOfThought('question -> answer')
        return qa(question=question)
```

## 📊 Monitoring and Debugging

### Inspect Model History
```python
# Check usage and costs
print(f"Total calls: {len(lm.history)}")
print(f"Last call: {lm.history[-1]}")

# Access detailed metadata
last_call = lm.history[-1]
print(f"Tokens used: {last_call['usage']}")
print(f"Cost: ${last_call['cost']}")
```

### Enable/Disable Logging
```python
import dspy

# Enable detailed logging
dspy.enable_litellm_logging()

# Disable logging
dspy.disable_litellm_logging()
```

## 🚨 Common Issues and Solutions

### 1. Authentication Errors
```python
# Always check your environment variables
import os
print("OpenAI Key:", os.getenv('OPENAI_API_KEY', 'Not set'))
print("Anthropic Key:", os.getenv('ANTHROPIC_API_KEY', 'Not set'))
```

### 2. Rate Limiting
```python
# Configure retry settings
lm = dspy.LM('openai/gpt-4o-mini', 
             max_retries=3,
             timeout=30)
```

### 3. Model Not Found
```python
# Verify model name format
# Correct: 'provider/model-name'
# Incorrect: 'provider-model-name' or 'model-name'
```

## 🎯 Best Practices

1. **Use Environment Variables**: Keep API keys secure
2. **Enable Caching**: Reduce costs and improve performance (enabled by default)
3. **Choose Appropriate Models**: Match model capabilities to task complexity
4. **Monitor Usage**: Track token consumption and costs
5. **Handle Errors**: Implement proper error handling for production use
6. **Test Locally**: Use local models for development when possible

## 📚 Additional Resources

- [DSPy Documentation](https://dspy.ai/learn/programming/language_models/)
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [DSPy GitHub Repository](https://github.com/stanfordnlp/dspy)

This guide covers the most commonly used providers with DSPy. The beauty of the LiteLLM integration is that you can use any provider supported by LiteLLM with the same consistent DSPy interface!
