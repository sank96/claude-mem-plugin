# Troubleshooting

- Verify Node.js 18 or newer is installed.
- Confirm commands are run from the `claude-mem-plugin/` repository root.
- If hooks are unreliable, use the agent-driven fallback workflow.
- If the dashboard is stale, compare the timestamp in `docs/execution-status.json` with the page output.
- If the UI renders no workers or tasks, verify that the JSON schema still includes `activeWorkers`, `activeTask`, and `queueSummary`.
- If the CLI installer reports the wrong mode, check the platform policy for the current adapter before changing code.
