# claude-mem-plugin

[![CI](https://img.shields.io/github/actions/workflow/status/sank96/claude-mem-plugin/ci.yml?branch=main&label=ci)](https://github.com/sank96/claude-mem-plugin/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/sank96/claude-mem-plugin)](https://github.com/sank96/claude-mem-plugin/releases)
[![License](https://img.shields.io/github/license/sank96/claude-mem-plugin)](https://github.com/sank96/claude-mem-plugin/blob/main/LICENSE)
[![Issues](https://img.shields.io/github/issues/sank96/claude-mem-plugin)](https://github.com/sank96/claude-mem-plugin/issues)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![npx-ready](https://img.shields.io/badge/npx-ready-CB3837?logo=npm&logoColor=white)](https://github.com/sank96/claude-mem-plugin/blob/main/docs/npm-and-npx.md)

`claude-mem-plugin` brings [claude-mem](https://github.com/thedotmack/claude-mem) to `Codex`, `Claude Code`, and `Copilot CLI`.

This repository is the adapter and distribution layer. It does not replace upstream `claude-mem`. It packages the shared skill, installer entrypoints, and CLI-specific runtime wiring needed to run the same memory workflow across multiple agent clients.

The upstream [claude-mem documentation](https://docs.claude-mem.ai/introduction) remains the canonical reference for the memory engine itself.

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Highlights](#highlights)
- [Support Matrix](#support-matrix)
- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
- [Runtime Modes](#runtime-modes)
- [Verification](#verification)
- [Documentation](#documentation)
- [Release Model](#release-model)
- [Contributing](#contributing)

## Why This Exists

`claude-mem` is the upstream memory engine. `claude-mem-plugin` is the portability layer that makes that workflow usable across multiple CLI environments without teaching users a different install and integration model for each client.

This package gives you:

- one shared `claude-mem` skill across supported CLIs
- one installation surface for `Codex`, `Claude Code`, and `Copilot CLI`
- one place to manage adapter policy, hook registration, and fallback behavior
- one release artifact you can distribute through GitHub Releases

## Highlights

- Shared memory skill for all supported CLIs
- Dedicated installers for `Codex`, `Claude Code`, and `Copilot CLI`
- One-shot setup with `npx claude-mem-plugin install all`
- Public CLI surface ready for `npx claude-mem-plugin ...`
- Optional global install with `npm install -g claude-mem-plugin`
- Conservative runtime policy with Windows fallback mode
- Separate source-install flow for contributors and maintainers

## Support Matrix

| Client | Status | Install command | Notes |
| --- | --- | --- | --- |
| Codex | Available | `npx claude-mem-plugin install codex` | Installs the shared skill and removes any legacy `codex-mem` alias during reinstall |
| Claude Code | Available | `npx claude-mem-plugin install claude` | Updates `.claude/settings.json` and installs the shared skill |
| Copilot CLI | Available | `npx claude-mem-plugin install copilot` | Updates `.copilot/mcp-config.json` and installs the shared skill |

Convenience commands:

- `npx claude-mem-plugin install all`
- `npx claude-mem-plugin uninstall all`

## Quick Start

### Prerequisites

- Node.js `18+`
- upstream `claude-mem` already installed on the target machine
- package name and CLI command: `claude-mem-plugin`

### 1. Run it directly with `npx`

```bash
npx claude-mem-plugin install codex
npx claude-mem-plugin install claude
npx claude-mem-plugin install copilot
npx claude-mem-plugin install all
```

### 2. Or install it globally once

```bash
npm install -g claude-mem-plugin
claude-mem-plugin install codex
claude-mem-plugin install all
```

### 3. Restart the target CLI

Restart `Codex`, `Claude Code`, or `Copilot CLI` after installation so the new config and shared skill are reloaded.

### 4. Installing from a zip or git clone

That path is only for contributors, maintainers, or local source validation. Use [docs/from-source.md](docs/from-source.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## CLI Commands

| Client | Install | Uninstall |
| --- | --- | --- |
| Codex | `npx claude-mem-plugin install codex` | `npx claude-mem-plugin uninstall codex` |
| Claude Code | `npx claude-mem-plugin install claude` | `npx claude-mem-plugin uninstall claude` |
| Copilot CLI | `npx claude-mem-plugin install copilot` | `npx claude-mem-plugin uninstall copilot` |
| All supported clients | `npx claude-mem-plugin install all` | `npx claude-mem-plugin uninstall all` |

The same subcommands work after `npm install -g claude-mem-plugin`.

## Runtime Modes

The package currently uses two operating modes:

- `hook-driven`: the host runtime reliably triggers lifecycle hooks
- `agent-driven fallback`: the agent performs lifecycle steps explicitly when hooks are unavailable or not trusted

Current policy:

- macOS and other non-Windows platforms default to `hook-driven`
- Windows defaults to `agent-driven fallback`

## Verification

Check the target files below after installation:

- Codex: `~/.codex/config.toml`, `~/.codex/hooks.json`, `~/.agents/skills/claude-mem/`
- Claude Code: `~/.claude/settings.json`, `~/.claude/skills/claude-mem/`
- Copilot CLI: `~/.copilot/mcp-config.json`, `~/.copilot/skills/claude-mem/`

If you are migrating an older Codex-only setup, the installer removes any leftover `codex-mem` compatibility alias and keeps only the canonical `claude-mem` skill.

## Documentation

- [Installation](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Lifecycle](docs/lifecycle.md)
- [Install from source](docs/from-source.md)
- [Support matrix](docs/support-matrix.md)
- [Troubleshooting](docs/troubleshooting.md)
- [GitHub release playbook](docs/releasing.md)
- [npm and npx distribution status](docs/npm-and-npx.md)

## Release Model

Current distribution channels:

- public `npm` package
- `npx` install surface
- GitHub repository
- GitHub Releases with versioned `.zip` assets

Current npm distribution details are tracked in [docs/npm-and-npx.md](docs/npm-and-npx.md).

## Contributing

Contributions are welcome. Start with:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [Install from source](docs/from-source.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)

For local verification:

```bash
node --test
```
