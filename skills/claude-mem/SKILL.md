---
name: claude-mem
description: Access persistent cross-session memory shared across Claude Code, Codex CLI, and Copilot. Use proactively at the start of non-trivial work, when the user references past work or asks how something was solved before, and when the runtime requires agent-driven fallback instead of automatic hooks.
---

# claude-mem

Use the shared `claude-mem` memory store to recall past decisions, bugs, features, and context from prior sessions across supported CLIs.

## 3-Step Workflow

Always follow the lookup flow in order:

1. `search` to find relevant observations by query and get IDs.
2. `timeline` to inspect the surrounding context for the most relevant results.
3. `get_observations` to fetch full details only for the filtered IDs you actually need.

Filter first because `search` and `timeline` are cheap index passes, while full observation fetches are more expensive and should be reserved for the small set of results that survived filtering.

## Runtime Notes

- In hook-driven environments, rely on automatic lifecycle integration and let the hooks manage the lifecycle for you.
- In agent-driven fallback environments, explicitly run the fallback lifecycle sequence: `session start` -> `observation` -> `stop` -> `session end`.
- Use the shared memory store before starting non-trivial work, when the user references past work, or when you need to recover prior solutions, bugs, decisions, or context.
