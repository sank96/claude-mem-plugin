# Installation

The installers are intentionally boring: they should set up the host CLI, install the shared `claude-mem` skill, and then choose the runtime mode based on platform and adapter policy.

## Common prerequisites

- Node.js 18 or newer
- a working checkout of `claude-mem-plugin`
- access to the target CLI's configuration and skill directories
- the upstream `claude-mem` worker environment already available

## Codex

Run `npm run install:codex` from `claude-mem-plugin/`.

Expected mode:

- macOS: `hook-driven`
- Windows: `agent-driven fallback`

## Claude

Run `npm run install:claude` from `claude-mem-plugin/`.

Expected mode:

- macOS: `hook-driven` when hook support is validated
- Windows: `agent-driven fallback`

## Copilot CLI

Run `npm run install:copilot` from `claude-mem-plugin/`.

Expected mode:

- macOS: `hook-driven` only if validated locally
- Windows: `agent-driven fallback`

## Uninstall rules

- remove adapter-specific configuration
- remove the shared skill from the target CLI if it was installed there
- leave upstream `claude-mem` storage and worker data intact

## Failure handling

If installation fails, check the target CLI's config path, then verify the runtime policy selected the intended mode for that platform.
