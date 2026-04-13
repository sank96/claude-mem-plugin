# Future npm and npx Release Plan

This document tracks the future packaging work required to publish `claude-mem-plugin` through `npm` and `npx`.

Current state:

- distribution is `GitHub repository + GitHub Releases`
- the package is npm-ready but not yet published
- the public CLI entrypoint exists
- this machine is not authenticated to npm publish yet

## Target user experience

The target public experience should look like this:

```bash
npx claude-mem-plugin install codex
npx claude-mem-plugin install claude
npx claude-mem-plugin install copilot
```

Optional global install surface:

```bash
npm install -g claude-mem-plugin
claude-mem-plugin install codex
```

## Why this is not live yet

Publishing to npm before the package has a stable CLI contract would create a support burden immediately.

The remaining pieces are:

- first real npm publish
- publish and smoke-test automation
- public support expectations for Windows, macOS, and Linux

## Required package changes

The package now includes:

1. public package metadata
2. a `bin` entrypoint
3. a `files` whitelist
4. explicit Node engine requirements
5. an initial command grammar for install and uninstall flows

## Required CLI surface

The package now includes a public CLI wrapper that dispatches to the existing installers.

Recommended commands:

- `claude-mem-plugin install codex`
- `claude-mem-plugin install claude`
- `claude-mem-plugin install copilot`
- `claude-mem-plugin uninstall codex`
- `claude-mem-plugin uninstall claude`
- `claude-mem-plugin uninstall copilot`
- `claude-mem-plugin doctor`

`doctor` is still recommended before general npm distribution so users can validate:

- Node version
- upstream `claude-mem` presence
- expected config paths
- runtime mode selection

## Release engineering requirements

Before enabling `npm publish`, add:

- smoke tests for `npx` execution
- smoke tests for global install
- archive inspection to confirm the shared skill and installers are included
- a publish checklist for Windows, macOS, and Linux
- provenance-enabled publish if the release environment supports it

## Recommended rollout

### Phase 1

Stay on `GitHub Releases` only while stabilizing the public README and release process.

### Phase 2

Ship an internal or beta npm release with a limited CLI surface.

Examples:

- `npx claude-mem-plugin install codex`
- `npx claude-mem-plugin install claude`

### Phase 3

Open general npm distribution once:

- the CLI grammar is stable
- publish automation is documented
- support expectations are written down
- first-run verification is reliable

## Exit criteria for npm availability

Do not publish to npm until all of the following are true:

- the CLI entrypoint is implemented
- `node --test` covers the public CLI wrapper
- a clean machine can install from `npx` without local repo context
- the README documents both `GitHub Releases` and `npm` clearly
