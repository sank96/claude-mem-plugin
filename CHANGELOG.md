# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-04-13

### Changed

- README now presents the public npm install flow first, with `npx claude-mem-plugin ...` and optional `npm install -g claude-mem-plugin`
- Source checkout and release-zip installation guidance moved into `docs/from-source.md` for contributors and maintainers
- Installation docs now describe `npx` and global install as the primary public entrypoints

### Fixed

- Quick start no longer mixes end-user package installation with contributor checkout workflows
- Documentation now makes the package and CLI name `claude-mem-plugin` explicit in the onboarding path

## [0.1.1] - 2026-04-13

### Changed

- Codex installs now keep only the canonical `claude-mem` skill and remove the legacy `codex-mem` alias during reinstall
- npm and `npx` documentation now describes the currently published install surface instead of a future release plan

### Fixed

- Codex skill discovery no longer shows the installed legacy alias as a second `claude-mem` entry after reinstall
- Documentation links now point to the current npm and `npx` guide under `docs/npm-and-npx.md`

## [0.1.0] - 2026-04-13

### Added

- Initial public package for distributing `claude-mem` adapters across `Codex`, `Claude Code`, and `Copilot CLI`
- Shared `claude-mem` skill delivery across all supported clients
- Installer and uninstaller entrypoints for each supported CLI
- Batch commands: `npm run install:all` and `npm run uninstall:all`
- Public release documentation for GitHub Releases
- Future packaging plan for `npm` and `npx`
- Open source repository surface:
  - license
  - changelog
  - contributing guide
  - code of conduct
  - security policy
  - issue templates
  - CI workflow

### Fixed

- Codex installer now restores the parent `mcp_servers.claude-mem` block before orphaned `tools.*` tables, preventing duplicate-key failures on reinstall
- Shared skill installer now preserves existing managed links for Claude Code and Copilot skill exposures instead of replacing them with standalone copies
