# Support Matrix

The table below reflects the current implementation status, not a promise that every host runtime is equally mature.

| CLI | Installer status | Integration surface | macOS / non-Windows | Windows |
| --- | --- | --- | --- | --- |
| Codex | available now | MCP config + shared skill + native hook registration | hook-driven | agent-driven fallback |
| Claude | available now | `.claude/settings.json` hooks + shared skill | hook-driven | agent-driven fallback |
| Copilot CLI | available now | `.copilot/mcp-config.json` + shared skill; no hook registration | agent-driven fallback | agent-driven fallback |

## Notes

- Codex remains the baseline migration target and the most battle-tested path.
- Windows remains conservative because hook behavior is not trusted as a default.
- Claude and Copilot now have runnable installer surfaces in this package.
- Copilot CLI centers on MCP registration and shared-skill delivery through the package installer.
- Copilot CLI stays on the fallback path in this package on every platform.
