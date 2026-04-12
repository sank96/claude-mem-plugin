# Installation

Task 1 only defines the package skeleton and documentation surface. The runnable installer entrypoints are planned for Task 5 and are not available yet.

## Common prerequisites

- Node.js 18 or newer
- a working checkout of `claude-mem-plugin`
- access to the target CLI's configuration and skill directories
- the upstream `claude-mem` worker environment already available

## Planned installer surface

- Codex installer and uninstaller
- Claude installer and uninstaller
- Copilot installer and uninstaller

## What Task 5 will add

- CLI-specific install commands
- adapter-specific mode selection
- skill installation into host CLI paths
- runtime policy reporting

## Current state

For Task 1, the documented behavior is read-only: the package structure, dashboard, and status model are available, but no installer command should be run yet.

## Uninstall rules

Uninstall commands are also planned for Task 5 and must not be treated as runnable in Task 1.

## Failure handling

If a future installer fails, check the target CLI's config path, then verify the runtime policy selected the intended mode for that platform.
