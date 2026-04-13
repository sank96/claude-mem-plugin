# Lifecycle

The package supports two lifecycle modes.

## Hook-driven

The host runtime automatically invokes lifecycle hooks.

Expected order:

1. session-start
2. post-tool-use
3. stop
4. session-end

Use this mode when the CLI/runtime is known to behave reliably on the current platform.
The shared runtime policy enables this mode on macOS and other non-Windows platforms.

## Agent-driven fallback

The agent explicitly performs lifecycle steps when hooks are unreliable or unavailable.

Expected order:

1. verify memory availability at task start
2. call session-start for non-trivial work
3. call observe after important steps
4. call stop and session-end when the work closes

This mode is the default safety net on Windows and the escape hatch when hook behavior is not trustworthy.
Current installers keep Windows in this mode and therefore skip hook registration there.

## Operational guidance

- do not rely on the user to remember the lifecycle commands
- keep observations tied to meaningful state changes
- close the session explicitly when a task is done so later work starts cleanly
- treat missing hooks on Windows as expected behavior, not as an installation failure
