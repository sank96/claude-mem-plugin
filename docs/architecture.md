# Architecture

`claude-mem-plugin` splits reusable memory workflow logic from CLI-specific integration points.

## Current implementation

- `core/` contains shared path, platform, runtime-policy, worker-client, and lifecycle helpers.
- `commands/` exposes shared fallback lifecycle entrypoints for agent-driven environments.
- `adapters/codex/` contains provider metadata, hook wrappers, and the Codex MCP template block.
- `adapters/claude/` contains the Claude provider metadata used by the installer layer.
- `adapters/copilot/` contains the Copilot provider metadata and wrapper hook scripts.
- `installers/shared/` contains reusable file, skill, and mode-summary helpers.
- `installers/codex/` wires the shared pieces into a local Codex environment.
- `installers/claude/` wires the shared pieces into a local Claude environment.
- `installers/copilot/` wires the shared pieces into a local Copilot environment.

## Adapter boundaries

- shared runtime logic belongs in `core/`
- explicit fallback entrypoints belong in `commands/`
- CLI-specific metadata, hook wrappers, and config templates belong in `adapters/`
- filesystem mutation and host-specific registration belong in `installers/`

## Design rules

- keep memory storage owned by upstream `claude-mem`
- keep Windows on `agent-driven fallback` unless a runtime is validated otherwise
- keep hook registration and config format details out of shared core code
- keep the shared `claude-mem` skill identical across CLIs
