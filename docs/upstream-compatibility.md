# Upstream Compatibility

`claude-mem-plugin` depends on an upstream `claude-mem` checkout that already exposes the worker runtime used by the package installers.

## What this package assumes

- the upstream `claude-mem` repository is present on disk
- the worker entrypoints used by this package are still available
- Codex support is advertised upstream before the Codex installer runs

## What this package owns

- client-specific config for Codex, Claude Code, and Copilot CLI
- shared skill installation
- local version markers used for idempotent install and upgrade behavior
- read-only diagnostics through `npx claude-mem-plugin doctor`

## What this package does not own

- the upstream memory engine implementation
- upstream worker internals
- product-level `claude-mem` documentation

If the upstream layout changes, `doctor` is expected to fail early by reporting `upstream claude-mem: NOT FOUND` or by surfacing adapter-level install gaps caused by missing worker files.
