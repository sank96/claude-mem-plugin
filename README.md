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
- [Installers](#installers)
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
- One-shot setup with `npm run install:all`
- Public CLI surface ready for `npx claude-mem-plugin ...`
- Optional global install with `npm install -g claude-mem-plugin`
- Conservative runtime policy with Windows fallback mode
- No `npm install` step required before running the installer scripts

## Support Matrix

| Client | Status | Install command | Notes |
| --- | --- | --- | --- |
| Codex | Available | `npm run install:codex` | Installs the shared skill and removes any legacy `codex-mem` alias during reinstall |
| Claude Code | Available | `npm run install:claude` | Updates `.claude/settings.json` and installs the shared skill |
| Copilot CLI | Available | `npm run install:copilot` | Updates `.copilot/mcp-config.json` and installs the shared skill |

Convenience commands:

- `npm run install:all`
- `npm run uninstall:all`

## Quick Start

### Prerequisites

- Node.js `18+`
- upstream `claude-mem` already installed on the target machine
- a local copy of this repository, either from GitHub Releases or a git clone

### 1. Get the package

Choose one:

- download the latest `.zip` from [Releases](https://github.com/sank96/claude-mem-plugin/releases)
- clone the repository

### 2. Open a terminal in the repository root

Windows PowerShell:

```powershell
cd C:\tools\claude-mem-plugin
```

macOS or Linux:

```bash
cd ~/tools/claude-mem-plugin
```

`npm install` is not required before running the installer scripts.

### 3. Install for your client

Codex:

```bash
npm run install:codex
```

Claude Code:

```bash
npm run install:claude
```

Copilot CLI:

```bash
npm run install:copilot
```

Install all supported clients on the same machine:

```bash
npm run install:all
```

Restart the target CLI after installation.

### npm and npx

The package is published to npm. You can install or run it directly with:

```bash
npx claude-mem-plugin install codex
npx claude-mem-plugin install claude
npx claude-mem-plugin install copilot
npx claude-mem-plugin install all
```

Optional global install:

```bash
npm install -g claude-mem-plugin
claude-mem-plugin install codex
```

For tarball validation and release steps, see [docs/releasing.md](docs/releasing.md).

## Installers

| Client | Install | Uninstall |
| --- | --- | --- |
| Codex | `npm run install:codex` | `npm run uninstall:codex` |
| Claude Code | `npm run install:claude` | `npm run uninstall:claude` |
| Copilot CLI | `npm run install:copilot` | `npm run uninstall:copilot` |
| All supported clients | `npm run install:all` | `npm run uninstall:all` |

The `install:all` wrapper runs all three installers, prints one result line per adapter, and exits non-zero if any adapter fails.

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
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)

For local verification:

```bash
node --test
```
