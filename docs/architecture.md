# Architecture

`claude-mem-plugin` splits reusable memory workflow logic from CLI-specific integration points.

## Core and adapters

- `core/` contains shared path, platform, runtime-policy, worker-client, and lifecycle helpers.
- `adapters/` contains CLI-specific metadata, hook wrappers, and install-time behavior.
- `installers/` contains the command entrypoints that wire adapters into a local CLI environment.

## Design rules

- keep memory storage owned by upstream `claude-mem`
- keep Windows on `agent-driven fallback` unless a runtime is validated otherwise
- keep hook registration and config format details out of shared core code
