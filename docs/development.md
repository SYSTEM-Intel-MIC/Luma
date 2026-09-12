# Development Guide

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Windows 10/11 (for testing)

## Setup

```bash
git clone https://github.com/SYSTEM-Intel-MIC/Luma.git
cd Luma
pnpm install
pnpm build:packages
pnpm dev
```

## Project Structure

```
luma/
├── apps/desktop/       # Electron app
│   ├── electron/src/   # Main process
│   └── renderer/src/   # React frontend
├── packages/
│   ├── shared/         # Types, constants, errors
│   ├── agent/          # Agent runtime
│   ├── models/         # Model providers
│   ├── tools/          # Tool implementations
│   ├── permissions/    # Permission + Risk Engine
│   ├── memory/         # Memory management
│   └── storage/        # SQLite storage
├── tests/              # Test files
└── docs/               # Documentation
```

## Building

```bash
pnpm build          # Build everything
pnpm build:packages # Build packages only
pnpm test           # Run tests
pnpm typecheck      # Type checking
```

## Testing

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage
```
