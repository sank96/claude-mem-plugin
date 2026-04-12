# Support Matrix

The table below reflects the Task 1 policy, not a claim that every host runtime is equally mature.

| CLI | macOS | Windows |
| --- | --- | --- |
| Codex | hook-driven | agent-driven fallback |
| Claude | hook-driven | agent-driven fallback |
| Copilot CLI | hook-driven when validated | agent-driven fallback |

## Notes

- Codex is the first migration target and should be treated as the most important baseline.
- Windows remains conservative because hook behavior is not trusted as a default.
- Copilot CLI stays conditional on validation so the docs do not overstate support.
