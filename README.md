# claude-mem-plugin

<p align="center">
  <a href="https://github.com/sank96/claude-mem-plugin">
    <img src="docs/assets/claude-mem-plugin-wordmark.svg" alt="claude-mem-plugin wordmark" width="820">
  </a>
</p>

<p align="center">
  <strong>Shared memory across <code>Codex</code>, <code>Claude Code</code>, and <code>Copilot CLI</code>.</strong>
</p>

<p align="center">
  <code>claude-mem-plugin</code> installs and manages the shared <a href="https://github.com/thedotmack/claude-mem">claude-mem</a> integration across supported CLIs, so the same memory workflow follows you across tools without setup drift.
</p>

[![CI](https://img.shields.io/github/actions/workflow/status/sank96/claude-mem-plugin/ci.yml?branch=main&label=ci)](https://github.com/sank96/claude-mem-plugin/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/sank96/claude-mem-plugin)](https://github.com/sank96/claude-mem-plugin/releases)
[![License](https://img.shields.io/github/license/sank96/claude-mem-plugin)](https://github.com/sank96/claude-mem-plugin/blob/main/LICENSE)
[![Issues](https://img.shields.io/github/issues/sank96/claude-mem-plugin)](https://github.com/sank96/claude-mem-plugin/issues)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![npx-ready](https://img.shields.io/badge/npx-ready-CB3837?logo=npm&logoColor=white)](https://github.com/sank96/claude-mem-plugin/blob/main/docs/npm-and-npx.md)

> One public install surface. One shared skill. One canonical integration path.

The upstream [claude-mem documentation](https://docs.claude-mem.ai/introduction) remains the canonical reference for the memory engine itself.

## At a Glance

| Keep memory aligned | Use a public install surface | Stay on the canonical engine |
| --- | --- | --- |
| Keep `Codex`, `Claude Code`, and `Copilot CLI` on the same shared memory integration path. | Use `npx claude-mem-plugin install all` for the fast path, or install globally if you prefer a fixed command. | `claude-mem-plugin` manages installation and config while upstream `claude-mem` remains the memory engine and product reference. |

## Quick Start

Install for every supported client:

```bash
npx claude-mem-plugin install all
```

Requirements:

- Node.js `18+`
- upstream `claude-mem` already installed on the target machine
- package and CLI name: `claude-mem-plugin`

Install for a single client:

```bash
npx claude-mem-plugin install codex
npx claude-mem-plugin install claude
npx claude-mem-plugin install copilot
```

Or install the command globally once:

```bash
npm install -g claude-mem-plugin
claude-mem-plugin install codex
claude-mem-plugin install all
```

Restart `Codex`, `Claude Code`, or `Copilot CLI` after installation so the new config and shared skill are reloaded. If you are evaluating the package for the first time, the quickest smoke test is `npx claude-mem-plugin install all` in a fresh shell.

To inspect upstream availability and per-client install state without changing any files:

```bash
npx claude-mem-plugin doctor
```

Source checkouts and release `.zip` installs are documented separately in [docs/from-source.md](docs/from-source.md).

## Why Use It

- `Shared memory without per-client drift.` Keep `Codex`, `Claude Code`, and `Copilot CLI` aligned around the same shared skill and config contract.
- `Public install from day one.` Use `npx` immediately or pin a global install if you want a fixed command on your machine.
- `Canonical upstream boundary.` This repository owns installation and client integration while upstream `claude-mem` remains the memory engine.
- `Conservative platform behavior.` Windows defaults to the safer `agent-driven fallback` path when hook reliability is weaker.

## What This Is

`claude-mem-plugin` is the cross-CLI integration layer for `claude-mem`.

It installs the shared skill, writes the client-specific config, and keeps the supported CLI entrypoints aligned around the same memory workflow.

## What This Is Not

`claude-mem-plugin` does not replace the upstream `claude-mem` engine.

If you need the memory engine itself, its architecture, or its product documentation, use the upstream [claude-mem repository](https://github.com/thedotmack/claude-mem) and [docs.claude-mem.ai](https://docs.claude-mem.ai/introduction).

## CLI Commands

| Client | Install | Uninstall |
| --- | --- | --- |
| Codex | `npx claude-mem-plugin install codex` | `npx claude-mem-plugin uninstall codex` |
| Claude Code | `npx claude-mem-plugin install claude` | `npx claude-mem-plugin uninstall claude` |
| Copilot CLI | `npx claude-mem-plugin install copilot` | `npx claude-mem-plugin uninstall copilot` |
| All supported clients | `npx claude-mem-plugin install all` | `npx claude-mem-plugin uninstall all` |
| Diagnostics | `npx claude-mem-plugin doctor` | n/a |

The same subcommands work after `npm install -g claude-mem-plugin`.

## Support Matrix

| Client | Status | Install command | Notes |
| --- | --- | --- | --- |
| Codex | Available | `npx claude-mem-plugin install codex` | Installs the shared skill and removes any legacy `codex-mem` alias during reinstall |
| Claude Code | Available | `npx claude-mem-plugin install claude` | Updates `.claude/settings.json` and installs the shared skill |
| Copilot CLI | Available | `npx claude-mem-plugin install copilot` | MCP + shared skill only; no hook registration - agent-driven on all platforms |

## Runtime Modes

The package currently uses two operating modes:

- `hook-driven`: the host runtime reliably triggers lifecycle hooks
- `agent-driven fallback`: the agent performs lifecycle steps explicitly when hooks are unavailable or not trusted

Current policy:

- Codex and Claude Code default to `hook-driven` on macOS and other non-Windows platforms
- Windows defaults to `agent-driven fallback`
- Copilot CLI uses `agent-driven fallback` on all platforms

Version markers created in `~/.codex`, `~/.claude`, and `~/.copilot` are used only for idempotent install and upgrade behavior. They do not replace the upstream memory engine or prove that the runtime is healthy on their own.

## Verification

Check the target files below after installation:

- Codex: `~/.codex/config.toml`, `~/.codex/hooks.json`, `~/.agents/skills/claude-mem/`
- Claude Code: `~/.claude/settings.json`, `~/.claude/skills/claude-mem/`
- Copilot CLI: `~/.copilot/mcp-config.json`, `~/.copilot/skills/claude-mem/`

For a read-only diagnostic pass:

```bash
npx claude-mem-plugin doctor
```

If you are migrating an older Codex-only setup, the installer removes any leftover `codex-mem` compatibility alias and keeps only the canonical `claude-mem` skill.

## Documentation

- [Installation](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Lifecycle](docs/lifecycle.md)
- [Upstream compatibility](docs/upstream-compatibility.md)
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
