# Tools

## Available Tools

### filesystem
File and directory operations: list, read, write, search, copy, move, rename, delete, info.

### shell.execute
Execute shell commands with security analysis. Commands are analyzed for risk before execution.

### windows.system
Get Windows system information: CPU, memory, disk, network, OS version, uptime.

### network
Network diagnostics: ping, DNS resolution, connectivity check, adapter info, full diagnosis.

### process
Process management: list processes, get process info, kill processes.

### system
System utilities: hostname, user info, environment paths.

## Tool Architecture

Each tool implements:
- `metadata` — Name, description, schema, risk level
- `execute(input)` — Execute with validated input
- `rollback()` — Undo last operation (if supported)

## Adding Tools

1. Create a class extending `BaseTool`
2. Define `metadata` with Zod schema
3. Implement `execute()` method
4. Register with `ToolRegistry`
