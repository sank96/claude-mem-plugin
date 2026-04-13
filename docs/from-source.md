# Install From Source

Use this guide only if you are:

- contributing to the repository
- validating a local checkout
- testing a GitHub Release `.zip`
- maintaining the package itself

If you only want to install the published package, go back to the [README](../README.md) and use `npx claude-mem-plugin ...` or `npm install -g claude-mem-plugin`.

## Prerequisites

- Node.js `18+`
- upstream `claude-mem` already installed on the target machine
- a local checkout of this repository or an extracted GitHub Release `.zip`

## Get the source tree

Choose one:

- clone the repository
- download the latest `.zip` from [GitHub Releases](https://github.com/sank96/claude-mem-plugin/releases) and extract it

Open a terminal in the repository root.

Windows PowerShell:

```powershell
cd C:\tools\claude-mem-plugin
```

macOS or Linux:

```bash
cd ~/tools/claude-mem-plugin
```

`npm install` is not required before running the source installer scripts.

## Source install commands

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

Install all supported clients:

```bash
npm run install:all
```

Uninstall all supported clients:

```bash
npm run uninstall:all
```

## Local verification

Run the test suite from the repository root:

```bash
node --test
```

For packaging and release operations, see [docs/releasing.md](releasing.md).
