# Architecture

## Overview

CmdRunner is a VS Code extension that reads a workspace-level `.cmdrunner` (JSON)
or `.cmdrunner.yml` (YAML) configuration file and renders each command entry as a
clickable button in the VS Code status bar. Commands execute inside VS Code
integrated terminal instances, optionally reusing existing terminals.

---

## Module Interactions

```
┌─────────────────────────────────────────────────────┐
│                   extension.ts                       │
│  activate() / deactivate()                          │
│  – wires up all modules, registers commands          │
└───────┬─────────────┬──────────────┬────────────────┘
        │             │              │
        ▼             ▼              ▼
  configLoader   statusBar      startupRunner
   (parse &      (render        (run startup[]
    validate)     buttons)       on activation)
        │             │
        ▼             ▼
  profileManager  terminalRunner
  (env profiles)  (execute cmd in
        │          VS Code terminal)
        ▼              │
  variableResolver    auditLog
  (${env:X}, etc.)   (optional log)
        │
        ▼
    security
  (blockedPatterns,
   checksum, trust)
        │
        ▼
    taskBridge
  (VS Code Task API
   integration)
```

---

## Data Flow

1. **Activation** – `extension.ts` calls `configLoader.load()` to parse and
   validate the `.cmdrunner` / `.cmdrunner.yml` file using Zod schemas defined
   in `src/types.ts`.
2. **Profile resolution** – `profileManager.resolveEnv()` merges the active
   profile's environment variables with the process environment.
3. **Status bar render** – `statusBar.render()` creates one
   `vscode.StatusBarItem` per command (up to `maxVisible`).
4. **Button click** – dispatches to `terminalRunner.run()`:
   - `variableResolver.resolve()` interpolates `${env:X}`, `${workspaceFolder}`,
     `${input:X}`, etc.
   - `security.validate()` checks workspace trust, blocked patterns, and
     optional checksum.
   - A VS Code `Terminal` is created or reused.
   - The resolved command string is sent to the terminal via `terminal.sendText()`.
   - `auditLog.record()` writes an entry if audit logging is enabled.
5. **Task bridge** – `taskBridge.ts` exposes a custom task provider of type
   `cmdrunner` so commands can be run as VS Code tasks (e.g. for `preLaunchTask`
   in `launch.json`).

---

## Security Model

See `docs/security.md` for the full security model.

Key points:
- **Workspace trust** – commands are blocked in untrusted workspaces.
- **Blocked patterns** – configurable glob/regex list (`blockedPatterns`).
- **Checksum verification** – a SHA-256 checksum can be embedded in the config;
  the extension refuses to run the command if the hash does not match.
- **Secret masking** – `${env:X}` values are never echoed in the UI or audit log.
- **Variable interpolation escaping** – metacharacters are escaped unless
  `unsafeInterpolation: true` is set per-command.

---

## Extension Lifecycle

| Phase | Action |
|---|---|
| `activate` | Load config, init modules, render status bar, run startup commands |
| `onDidChangeWorkspaceFolders` | Reload config for new/removed roots |
| `onDidChangeConfiguration` | Re-render status bar on VS Code settings change |
| File watcher | Re-parse `.cmdrunner` / `.cmdrunner.yml` on save |
| `deactivate` | Dispose status bar items, terminal listeners, file watchers |

---

## Key Design Decisions

- **Zod for validation** – provides both runtime validation and TypeScript types
  from a single source of truth (`src/types.ts`).
- **No shell spawning** – commands are sent to VS Code terminals via
  `terminal.sendText()` rather than spawning child processes, which keeps the
  extension sandboxed within VS Code's process model.
- **Profile-based env isolation** – different sets of environment variables per
  profile avoids the need for per-command env blocks in most cases.
- **Opt-in audit log** – disabled by default to avoid writing sensitive data;
  enabled via `cmdrunner.auditLog` VS Code setting.
