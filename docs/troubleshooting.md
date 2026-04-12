# Troubleshooting

- Verify Node.js 18 or newer is installed.
- Confirm commands are run from the `claude-mem-plugin/` repository root.
- If hooks are unreliable, use the agent-driven fallback workflow.
- If you open `docs/dashboard.html` with `file://`, use the file picker to load the current local `execution-status.json` instead of relying on the embedded starter snapshot.
- If the UI renders no tasks or agents, verify that the JSON schema still includes `taskBoard`, `spawnedAgents`, `activeTask`, and `queueSummary`.
- If the CLI installer reports the wrong mode, check the platform policy for the current adapter before changing code.
