# Luma

> **Your AI on Windows.**
>
> Tell Luma what you want to accomplish; it plans the work, uses scoped tools to do it, and asks before actions that could be risky.

[![Build and Release](https://github.com/SYSTEM-Intel-MIC/Luma/actions/workflows/build-and-release.yml/badge.svg)](https://github.com/SYSTEM-Intel-MIC/Luma/actions/workflows/build-and-release.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)

Luma is a local-first, open-source Windows desktop AI agent. It combines an Electron desktop shell, a typed agent runtime, pluggable model providers, and a permission system so that natural-language requests can be turned into observable, controllable computer tasks.

**Ask Luma. Get it done.**

> **Project status — early development.** The core runtime, permissions, tool registry, settings UI, tray integration, and Windows build pipeline are in place. Treat the app as experimental: review every permission prompt and do not rely on it for irreversible or safety-critical work.

## Why Luma?

Instead of asking you to find the right program and click through its menus, Luma is designed around a single workflow:

```text
Goal → understand → plan → evaluate risk → request permission when needed
     → execute tools → observe → verify → report
```

For example, you can ask Luma to search for a file, inspect system or network information, or organize a set of files. The agent runtime is deliberately separated from the platform UI so tools, models, and policies remain testable and extensible.

## Highlights

- **AI-first desktop experience** — summon the floating window with `Ctrl+Space`, enter a goal, and keep the app available from the system tray.
- **Agent runtime** — task state, planning, bounded execution, observations, and cancellation/pause controls.
- **Safety by design** — risk analysis and explicit permission handling before higher-risk operations; the renderer is isolated from Node.js APIs.
- **Tool architecture** — filesystem, shell, Windows, network, process, and system tools are registered through a shared typed registry.
- **Model flexibility** — OpenAI, Anthropic, Google Gemini, DeepSeek, and OpenRouter provider implementations, with an extensible provider layer.
- **Local-first data** — configuration, task history, and memory are stored on the local machine; no Luma account or telemetry is required.
- **Type-safe monorepo** — TypeScript workspaces for the shared contracts, agent, models, permissions, tools, memory, storage, and desktop application.

## Quick start

### Requirements

- Windows 10 or Windows 11 for the supported desktop target
- [Node.js](https://nodejs.org/) 20 or later
- [pnpm](https://pnpm.io/) 9 or later

### Run from source

```bash
git clone https://github.com/SYSTEM-Intel-MIC/Luma.git
cd Luma
pnpm install
pnpm build:packages
pnpm dev
```

Then press `Ctrl+Space` to show or hide Luma. In development, start the Vite dev server before launching Electron when your workflow requires it.

### Build an installer

On Windows, create the release artifact with:

```bash
pnpm build:packages
pnpm build:desktop
```

The packaged installer is written beneath `apps/desktop/release/`. Tagged releases are built by GitHub Actions and published on the [Releases page](https://github.com/SYSTEM-Intel-MIC/Luma/releases).

## Configuration

Open **Settings** in the desktop app to configure a model provider, API key, endpoint, and model. API keys stay in the local application configuration and must never be committed to the repository.

Supported provider modules:

| Provider      | Module                             |
| ------------- | ---------------------------------- |
| OpenAI        | `@luma/models` OpenAI provider     |
| Anthropic     | `@luma/models` Anthropic provider  |
| Google Gemini | `@luma/models` Google provider     |
| DeepSeek      | `@luma/models` DeepSeek provider   |
| OpenRouter    | `@luma/models` OpenRouter provider |

See the [model guide](docs/models.md) for the provider abstraction and configuration notes.

## Security and permissions

Luma operates on a user's computer, so safety is a core product boundary—not an optional add-on.

- Tool requests are evaluated by a risk engine before execution.
- Permission decisions are delivered through validated Electron IPC and are required for actions above the configured automatic-execution threshold.
- The Electron renderer uses context isolation and does not enable Node integration.
- Luma does not enable telemetry by default.
- Never enter secrets into prompts or commit `.env`, key, or secrets files.

Read [SECURITY.md](SECURITY.md) before reporting a vulnerability, and review the detailed [security documentation](docs/security.md) and [permission model](docs/permissions.md).

## Architecture

```text
apps/desktop              Electron main process + React renderer
packages/agent            Task lifecycle, planning, context, execution loop
packages/models           Provider interface and provider implementations
packages/tools            Typed tool definitions and registry
packages/permissions      Risk evaluation and permission management
packages/memory           Long-lived memory coordination
packages/storage          Local database-backed stores
packages/shared           Shared types, constants, errors, and utilities
tests/unit                Fast unit coverage for the core packages
```

For design decisions and module boundaries, start with the [architecture overview](docs/architecture.md). More focused documentation is available for the [agent runtime](docs/agent.md), [tools](docs/tools.md), [memory](docs/memory.md), and [development workflow](docs/development.md).

## Development

```bash
# Build all reusable packages (does not package Electron)
pnpm build:packages

# Run unit tests
pnpm test

# Check TypeScript at the repository root
pnpm typecheck

# Build only the renderer bundle
pnpm --filter @luma/desktop build:vite

# Create the desktop package
pnpm build:desktop
```

The CI workflow installs from the committed lockfile, builds the packages, runs unit tests and type checks, and packages a Windows artifact. Build failures are intentionally fatal so broken releases are not published.

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and include tests for behavior changes where practical.

## Roadmap

The project is focused on delivering a reliable and secure Windows MVP before expanding its surface area:

1. Harden the agent loop, task controls, and permission UX.
2. Complete file-management and Windows diagnostic workflows.
3. Add robust browser/document capabilities behind the same permission boundary.
4. Improve accessibility, localization, and end-to-end coverage.

## License and attribution

Luma is free and open-source software licensed under the [GNU General Public License v3.0](LICENSE).

Developed by **SYSTEM-Intel-MIC**.
