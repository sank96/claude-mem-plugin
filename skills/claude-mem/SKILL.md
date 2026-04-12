---
name: claude-mem
description: Access persistent cross-session memory shared across Claude Code, Codex CLI, and Copilot. Use when starting non-trivial work, when recalling prior solutions, or when the runtime requires agent-driven fallback lifecycle instead of automatic hooks.
---

# claude-mem

Use the shared `claude-mem` memory store to recall past decisions, bugs, features, and context from prior sessions across supported CLIs.

## 3-Step Workflow

Follow the lookup flow in order:

1. `search` to find relevant observations by query and get IDs.
2. `timeline` to inspect context around the most relevant results.
3. `get_observations` to fetch full details only for filtered IDs.

## Runtime Notes

- In hook-driven environments, rely on automatic lifecycle integration.
- In agent-driven fallback environments, explicitly run session start, observation, stop, and session end helpers.
- Prefer the shared memory store before starting non-trivial work or when a user refers to past work.
