# claude-mem-plugin

`claude-mem-plugin` is a standalone adapter package for integrating `claude-mem` with Codex, Claude Code, and Copilot CLI.

It is designed as a child repository with its own git history. The parent workspace is only a source and incubation area.

## What it provides

- one shared `claude-mem` skill
- a shared runtime core for lifecycle and policy decisions
- CLI-specific adapters for Codex, Claude, and Copilot
- package-local documentation and execution tracking

## How to think about it

The package supports two runtime modes:

- `hook-driven` means the host runtime fires lifecycle hooks automatically and the adapter can stay mostly invisible.
- `agent-driven fallback` means the runtime is not reliable enough to trust hooks, so the agent explicitly performs memory lifecycle steps.

The important rule is that memory behavior still comes from `claude-mem`. This package only adapts how each CLI reaches it.

## Repository layout

- `core/` holds shared runtime logic
- `adapters/` holds CLI-specific integration code
- `installers/` holds install and uninstall entrypoints
- `skills/` holds the shared `claude-mem` skill
- `docs/` holds operator docs and local dashboard files

## Installation

Prerequisites:

- Node.js 18 or newer
- access to the target CLI configuration and skill paths
- the upstream `claude-mem` worker and storage available in the expected environment

The runnable installer entrypoints are planned for Task 5. They are not part of the Task 1 surface yet, so this package does not advertise `install:*` or `uninstall:*` commands here.

### Planned for Task 5

- Codex installer and uninstaller entrypoints
- Claude installer and uninstaller entrypoints
- Copilot installer and uninstaller entrypoints

## Installation flow

When the installer surface exists in later tasks, every installer should do the same high-level work:

1. verify prerequisites
2. register the CLI adapter configuration
3. install the shared `claude-mem` skill
4. configure hooks only when the runtime policy allows it
5. report whether the result is `hook-driven` or `agent-driven fallback`

Uninstallers must remove adapter-specific artifacts only. They must not delete upstream `claude-mem` data.

## Shared skill

The `claude-mem` skill teaches the same memory workflow across CLIs:

- search first for prior work
- inspect the surrounding timeline when a match matters
- fetch concrete observations before relying on them
- explicitly close the lifecycle in fallback mode

This package keeps the skill cross-CLI so operators do not have to learn a separate memory workflow for each adapter.

## Runtime modes

- `hook-driven` means the host runtime triggers lifecycle hooks automatically.
- `agent-driven fallback` means the agent explicitly performs lifecycle steps when hooks are unreliable or unavailable.

## Upgrade and uninstall

- Upgrade by revisiting this package after later tasks add the runnable installers.
- Uninstall will be handled by the Task 5 adapter-specific entrypoints.
- If a CLI is in `agent-driven fallback`, do not assume adapter removal changes upstream memory data.

## Troubleshooting quick hits

- If hooks do not fire, check whether the platform is expected to use `agent-driven fallback`.
- If a CLI cannot find the skill, confirm the package was installed from `claude-mem-plugin/`.
- If the dashboard looks stale, refresh `docs/execution-status.json` and reopen `docs/dashboard.html`.

## Documentation

- [Architecture](docs/architecture.md)
- [Installation](docs/installation.md)
- [Lifecycle](docs/lifecycle.md)
- [Support matrix](docs/support-matrix.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Execution status](docs/execution-status.md)

## Status dashboard

Open `docs/dashboard.html` in a browser to inspect `docs/execution-status.json`.
