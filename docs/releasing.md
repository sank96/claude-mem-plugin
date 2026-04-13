# GitHub Release Playbook

This document is the maintainer runbook for packaging `claude-mem-plugin` and publishing it through GitHub Releases.

The current public distribution model is:

1. keep the repository public on GitHub
2. create a versioned release tag
3. attach a versioned `.zip` archive as a release asset

## What gets shipped

The release asset should contain the full package, including:

- `README.md`
- `package.json`
- `installers/`
- `adapters/`
- `skills/`
- `core/`
- `commands/`
- `docs/`

Do not ship only the skill folder. The release archive must preserve the installer and adapter layout.

## Preconditions

Before cutting a release:

- the working tree is clean enough for a release
- `package.json` version is correct
- the README reflects the current public install flow
- the docs point to the correct release channel
- tests pass locally

Run verification from the repository root:

```powershell
node --test
```

## Release flow

### 1. Pick the version

Update `package.json` to the target version if needed.

Recommended tag format:

- `v0.1.0`
- `v0.2.0`
- `v1.0.0`

### 2. Commit the release state

Example:

```powershell
git add README.md docs package.json
git commit -m "release: v0.1.0"
```

### 3. Create the Git tag

```powershell
git tag v0.1.0
```

### 4. Build the release archive

Create a deterministic archive directly from git so you do not accidentally ship local junk.

```powershell
$version = "0.1.0"
New-Item -ItemType Directory -Force .\dist | Out-Null
git archive --format=zip --prefix="claude-mem-plugin-v$version/" --output=".\dist\claude-mem-plugin-v$version.zip" HEAD
```

### 5. Generate a checksum

```powershell
Get-FileHash ".\dist\claude-mem-plugin-v0.1.0.zip" -Algorithm SHA256
```

Save the resulting SHA256 in the release notes or in a companion checksum file if you want stronger operator trust.

### 6. Push commit and tag

```powershell
git push origin main
git push origin v0.1.0
```

### 7. Publish the GitHub Release

From the GitHub repository:

1. open `Releases`
2. create a new release from tag `v0.1.0`
3. use a release title like `v0.1.0`
4. upload `dist/claude-mem-plugin-v0.1.0.zip`
5. paste short operator notes:
   - supported installers
   - notable changes
   - upgrade or uninstall notes if relevant

## Recommended release notes structure

Keep release notes operator-focused:

- what changed
- who should upgrade
- whether install commands changed
- whether any runtime policy changed
- whether users need to uninstall first

Example:

```text
claude-mem-plugin v0.1.0

- Adds public installers for Codex, Claude Code, and Copilot CLI
- Standardizes the shared claude-mem skill across all three clients
- Uses GitHub Releases as the primary distribution channel

Install:
- npm run install:all
- npm run install:codex
- npm run install:claude
- npm run install:copilot
```

## Post-release checks

After publishing:

1. download the uploaded `.zip` from GitHub Releases
2. extract it to a clean folder
3. run at least one installer from the extracted archive
4. confirm the README still matches the published asset

## First public release checklist

For the first public release, also confirm:

- the repository description is clear
- the README is written for external users, not only internal collaborators
- the upstream `claude-mem` links are correct
- the release asset name is stable and versioned
- the `Releases` page explains that `claude-mem` is a prerequisite
