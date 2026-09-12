# Luma Architecture

## Overview

Luma follows a modular, layered architecture designed for extensibility and separation of concerns.

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
├── Tools
├── Storage (SQLite via better-sqlite3)
└── Security (Permission + Risk Engine)
```

## Desktop Shell

Electron provides the native desktop integration:
- **Window Manager** — Creates and manages the floating window
- **Tray Manager** — System tray icon and context menu
- **Global Shortcut** — Ctrl+Space to summon/hide
- **IPC Handler** — Secure bridge between renderer and main process
- **Startup Manager** — Launch at Windows startup

## Renderer (React)

The renderer process handles all UI:
- **FloatingUI** — Minimal input interface
- **ChatView** — Task execution display with steps and streaming
- **PermissionDialog** — Risk-based permission requests
- **SettingsView** — Configuration panels
- **Zustand Store** — Reactive state management

## Agent Runtime

The core execution engine implementing the full Agent Loop:

```
User Request → Context Assembly → Model → Intent Understanding
→ Planning → Tool Selection → Risk Evaluation → Permission Check
→ Tool Execution → Observation → Verification → Replanning → Complete
```

Key components:
- **Agent Loop** — Main execution cycle with safety guards
- **Planner** — Generates and manages execution plans
- **Context Manager** — Manages conversation context within token budget
- **System Prompt Builder** — Dynamically constructs system prompts

## Model Layer

Abstract provider interface supporting:
- OpenAI (GPT-4o, etc.)
- Anthropic (Claude)
- Google (Gemini)
- DeepSeek
- OpenRouter
- Custom OpenAI-compatible endpoints

## Tools

All capabilities are implemented as tools with:
- Typed input schema (Zod)
- Risk level declaration
- Permission requirements
- Rollback support (where applicable)
- User-friendly error messages

## Storage

SQLite via better-sqlite3 for:
- Configuration persistence
- Task history
- Memory entries
- Permission rules
- Chat history

## Security

Multi-layer security:
- Permission System (5 levels: NONE → CRITICAL)
- Risk Engine (independent risk analysis)
- Shell Sandbox (command analysis before execution)
- Protected Directories (system paths blocked)
- API Key Protection (never logged or exposed)
