# Contributing

Thanks for contributing to `claude-mem-plugin`.

## Before You Start

- read the [README](README.md)
- check existing [issues](https://github.com/sank96/claude-mem-plugin/issues)
- open a discussion through an issue before large changes

## Local Setup

Prerequisites:

- Node.js `18+`
- upstream `claude-mem` available if you are working on adapter integration paths

Run tests from the repository root:

```bash
node --test
```

## Scope

Good contribution areas:

- installer reliability
- adapter behavior
- docs quality
- test coverage
- packaging and release workflow

## Pull Requests

Please keep pull requests focused:

- one logical change per PR
- include tests when behavior changes
- update docs when installation, runtime behavior, or release flow changes

## Commit Style

You do not need a rigid commit convention, but concise, descriptive commit messages are preferred.

Examples:

- `feat: add install-all wrapper`
- `docs: improve open source quick start`
- `test: cover copilot installer failure path`

## Reporting Bugs

Use the bug report issue template and include:

- platform
- target CLI
- exact install command used
- expected behavior
- actual behavior
- relevant logs or config snippets

## Feature Requests

Use the feature request template and explain:

- problem
- proposed change
- target users
- compatibility considerations
