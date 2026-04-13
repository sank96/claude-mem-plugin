# npm and npx Distribution Status

This document tracks the current public npm distribution for `claude-mem-plugin`.

Current state:

- distribution is available through `npm`, `npx`, the GitHub repository, and GitHub Releases
- the package is published as `claude-mem-plugin@0.1.1`
- the public CLI entrypoint is live
- public install and reinstall flows have been smoke-tested from the published package

## Public install surface

Direct execution with `npx`:

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

## Current CLI contract

The published package currently supports:

- `claude-mem-plugin install codex`
- `claude-mem-plugin install claude`
- `claude-mem-plugin install copilot`
- `claude-mem-plugin install all`
- `claude-mem-plugin uninstall codex`
- `claude-mem-plugin uninstall claude`
- `claude-mem-plugin uninstall copilot`
- `claude-mem-plugin uninstall all`

## Package status

The package includes:

1. public package metadata
2. a `bin` entrypoint
3. a `files` whitelist
4. explicit Node engine requirements
5. a published npm tarball with validated install and uninstall flows

## Verified operator expectations

The current release has been verified for:

- local `node --test`
- tarball execution through `npm exec --package`
- public `npx` execution
- clean-environment Docker smoke tests for install, reinstall, and uninstall

## Remaining improvements

Future improvements can build on the published surface without changing the distribution model:

- add a dedicated `doctor` command for prerequisite checks
- automate Docker smoke tests in CI
- add explicit release notes for compatibility cleanup behavior
