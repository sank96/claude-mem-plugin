# claude-mem-plugin

`claude-mem-plugin` is a standalone adapter package for integrating `claude-mem` with Codex, Claude Code, and Copilot CLI.

## What it provides

- one shared `claude-mem` skill
- a shared runtime core for lifecycle and policy decisions
- CLI-specific adapters for Codex, Claude, and Copilot
- package-local documentation and execution tracking

## Repository layout

- `core/` holds shared runtime logic
- `adapters/` holds CLI-specific integration code
- `installers/` holds install and uninstall entrypoints
- `skills/` holds the shared `claude-mem` skill
- `docs/` holds operator docs and local dashboard files

## Installation

### Codex

Use `npm run install:codex`.

### Claude

Use `npm run install:claude`.

### Copilot CLI

Use `npm run install:copilot`.

## Runtime modes

- `hook-driven` means the host runtime triggers lifecycle hooks automatically.
- `agent-driven fallback` means the agent explicitly performs lifecycle steps when hooks are unreliable or unavailable.

## Documentation

- [Architecture](docs/architecture.md)
- [Installation](docs/installation.md)
- [Lifecycle](docs/lifecycle.md)
- [Support matrix](docs/support-matrix.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Execution status](docs/execution-status.md)

## Status dashboard

Open `docs/dashboard.html` in a browser to inspect `docs/execution-status.json`.
