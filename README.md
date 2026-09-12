# Luma

**Your AI on Windows.**

Luma is an open-source Windows AI Agent that understands your goals and operates your computer to accomplish them. You tell Luma what you want to achieve, and it figures out how.

> **Ask Luma. Get it done.**

## Features

- **AI-First Interface** — Natural language is the primary input. Tell Luma your goal, not the steps.
- **Agent Runtime** — Full Agent Loop: understand → plan → execute → observe → verify → complete.
- **Tool System** — File system, shell, Windows system info, network diagnostics, browser automation, and more.
- **Permission & Risk Engine** — High-risk operations require your approval. Luma never acts without authorization on dangerous tasks.
- **Floating UI** — Minimal, modern floating window. Ctrl+Space to summon.
- **System Tray** — Runs in the background, always ready.
- **Memory** — Remembers your preferences and context across sessions.
- **Model Flexibility** — Supports OpenAI, Anthropic, Google Gemini, DeepSeek, OpenRouter, and any OpenAI-compatible endpoint.
- **Local-First** — Configuration, history, and memory stored locally. No cloud account required.
- **Streaming** — Real-time AI responses and tool execution status.

## Installation

### Prerequisites

- Windows 10 / 11
- Node.js >= 20
- pnpm >= 9

### From Source

```bash
git clone https://github.com/SYSTEM-Intel-MIC/Luma.git
cd Luma
pnpm install
pnpm build:packages
pnpm dev
```

### Release

Download `Luma Setup.exe` from the [Releases](https://github.com/SYSTEM-Intel-MIC/Luma/releases) page.

## Configuration

After launching, open Settings to configure your AI model provider:

- **Provider** — OpenAI, Anthropic, Google, DeepSeek, OpenRouter, or Custom
- **API Key** — Your provider API key
- **Base URL** — Custom endpoint (for OpenAI-compatible services)
- **Model** — Select or specify a model

API keys are stored locally and never sent to Luma servers.

## Architecture

```
Luma
├── Desktop Shell (Electron)
├── Renderer (React + TypeScript + Vite)
├── Main Process (Node.js + TypeScript)
├── Agent Runtime
│   ├── Agent Loop
│   ├── Planner
│   ├── Tool Router & Executor
│   ├── Risk Engine
│   ├── Permission Manager
│   ├── Context Manager
│   ├── Memory Manager
│   └── Task Manager
├── Model Layer (Provider Interface)
├── Tools (File System, Shell, Windows, Network, Process, Browser, Computer Use, Document, System)
├── Storage (SQLite)
└── Security (Permission + Risk Engine)
```

See [docs/architecture.md](docs/architecture.md) for details.

## Model Providers

| Provider | Supported |
|---|---|
| OpenAI | Yes |
| Anthropic | Yes |
| Google Gemini | Yes |
| DeepSeek | Yes |
| OpenRouter | Yes |
| Custom (OpenAI Compatible) | Yes |

## Development

```bash
pnpm install
pnpm build:packages
pnpm dev
pnpm test
pnpm build
```

## Security

- **Permission System** — 5-level permission system (NONE to CRITICAL)
- **Risk Engine** — Analyzes operations before execution
- **Shell Sandbox** — Commands analyzed for risk before execution
- **Electron Security** — contextIsolation enabled, no nodeIntegration
- **IPC Validation** — All IPC messages validated
- **No telemetry by default**
- **API keys never logged or committed**

See [SECURITY.md](SECURITY.md) for the full security policy.

## Documentation

- [Architecture](docs/architecture.md)
- [Agent Runtime](docs/agent.md)
- [Tools](docs/tools.md)
- [Permissions](docs/permissions.md)
- [Models](docs/models.md)
- [Memory](docs/memory.md)
- [Security](docs/security.md)
- [Development Guide](docs/development.md)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Luma is free and open-source software licensed under [GPL-3.0](LICENSE).

**Developed by SYSTEM-Intel-MIC.**

> **Ask Luma. Get it done.**
