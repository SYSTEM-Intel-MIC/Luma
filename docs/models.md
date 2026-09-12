# Model Providers

## Supported Providers

- **OpenAI** — GPT-4o, GPT-4, etc.
- **Anthropic** — Claude Sonnet, Opus
- **Google** — Gemini 2.0 Flash, Pro
- **DeepSeek** — DeepSeek Chat, Reasoner
- **OpenRouter** — Access to many models
- **Custom** — Any OpenAI-compatible endpoint

## Configuration

Configure in Settings or `config/app-config.json`:

```json
{
  "models": {
    "providers": [{
      "type": "openai",
      "apiKey": "sk-...",
      "defaultModel": "gpt-4o",
      "enabled": true
    }]
  }
}
```

## Model Router

Auto-routing selects the best model based on:
- Task complexity
- Required capabilities (vision, tool calling, reasoning)
- Available providers
