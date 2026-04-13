# Installation

`claude-mem-plugin` installs the adapter layer on top of [claude-mem](https://github.com/thedotmack/claude-mem). If you need upstream product documentation first, start from [docs.claude-mem.ai](https://docs.claude-mem.ai/introduction).

Current state:

- Codex installer is available now.
- Claude installer is available now.
- Copilot installer is available now.

## Common prerequisites

- Node.js 18 or newer
- a working checkout of `claude-mem-plugin`
- access to the target CLI's configuration and skill directories
- the upstream `claude-mem` worker environment already available

Before running an installer, open a terminal in the package root:

```powershell
cd C:\path\to\claude-mem-plugin
```

```bash
cd /path/to/claude-mem-plugin
```

This package currently has no external npm dependencies, so `npm install` is not required before `npm run install:*`.

## Install everything at once

If the same machine uses `Codex`, `Claude Code`, and `Copilot CLI`, you can install every supported adapter in one run:

`npm run install:all`

The wrapper executes all three installers, prints one result line per adapter, and exits non-zero if any adapter fails.

To remove all three integrations in one run:

`npm run uninstall:all`

## Codex

Run:

`npm run install:codex`

The installer:

1. verifies the upstream `claude-mem` runtime exposes Codex support
2. resolves the upstream `claude-mem` MCP server
3. writes the Codex MCP block into `.codex/config.toml`
4. installs the shared `claude-mem` skill into the host skill path
5. removes any legacy `codex-mem` compatibility alias from older Codex-only installs
6. writes Codex hook entries only when the runtime policy is `hook-driven`
7. prints the selected mode summary

Remove the Codex integration with:

`npm run uninstall:codex`

The uninstaller removes only the Codex-specific MCP block, hooks, the copied shared skill directory, and any leftover `codex-mem` compatibility alias.

## Claude

Run:

`npm run install:claude`

The installer:

1. creates or updates `.claude/settings.json`
2. copies the shared `claude-mem` skill into `.claude/skills`
3. writes Claude hook entries only when the runtime policy is `hook-driven`
4. prints the selected mode summary

Remove the Claude integration with:

`npm run uninstall:claude`

The uninstaller removes only the Claude hook config entries and copied skill directory.

## Copilot

Run:

`npm run install:copilot`

The installer:

1. creates or updates `.copilot/mcp-config.json`
2. copies the shared `claude-mem` skill into `.copilot/skills`
3. registers the `claude-mem` MCP server for Copilot CLI
4. prints the selected mode summary

Remove the Copilot integration with:

`npm run uninstall:copilot`

The uninstaller removes only the Copilot MCP config entry and copied skill directory.

## Runtime policy

- macOS and other non-Windows platforms resolve to `hook-driven`
- Windows resolves to `agent-driven fallback`

## Failure handling

- If install fails, confirm the upstream `claude-mem` worker files are discoverable.
- If Codex install fails immediately, verify the upstream worker advertises the `codex` provider.
- If the wrong mode is reported, verify the platform passed through the shared runtime policy.
- If hooks are missing on Windows, that is expected because fallback mode does not write them.
- If Copilot does not see the MCP server, inspect `.copilot/mcp-config.json`.
