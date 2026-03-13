# Agent Knowledge Base

This is a living document maintained by automated agents and human contributors.
Append new entries at the bottom of the relevant section using the format:

```
[YYYY-MM-DD][category] Description
```

**Categories:** `architecture`, `security`, `testing`, `ci`, `schema`, `ux`,
`tooling`, `gotcha`, `decision`

---

## Architecture

[2025-01-01][architecture] Commands are sent to VS Code terminals via `terminal.sendText()` — not via `child_process.exec()`. This keeps the extension sandboxed within VS Code's process model and avoids cross-platform shell-spawning issues.

[2025-01-01][architecture] Zod is used as the single source of truth for config validation (`src/types.ts`). TypeScript types are inferred from Zod schemas — never maintain separate type definitions.

[2025-01-01][architecture] The config file is re-parsed on every file-save via a `vscode.workspace.onDidSaveTextDocument` watcher. Avoid expensive operations in the parse path.

[2025-01-01][architecture] `profileManager` merges profile env vars on top of `process.env` at command-run time, not at activation time. This means profile switches take effect immediately without reloading the extension.

[2025-01-01][architecture] `taskBridge.ts` registers a custom `TaskProvider` of type `cmdrunner`. This lets users reference CmdRunner commands in `tasks.json` and `launch.json` (`preLaunchTask`).

---

## Security

[2025-01-01][security] Workspace trust (`vscode.workspace.isTrusted`) is checked in `terminalRunner.ts` before every execution. Never bypass this check, even for startup commands.

[2025-01-01][security] Blocked patterns are stored in VS Code settings (`cmdrunner.blockedPatterns`), not in `.cmdrunner`. This ensures a workspace owner cannot whitelist their own dangerous commands.

[2025-01-01][security] SHA-256 checksums are computed over the raw `command` string value before variable interpolation. Always verify before interpolation to prevent hash-bypass via variable injection.

[2025-01-01][security] `${env:X}` values are masked as `[REDACTED:X]` in audit log output. The masking regex must be applied after the full resolved command string is built, not per-variable.

[2025-01-01][security] Shell metacharacters (`;`, `|`, `&`, `` ` ``, `$`, `>`, `<`) in interpolated variable values are escaped by default. The `unsafeInterpolation` flag disables this and triggers an audit-log warning.

---

## Schema

[2025-01-01][schema] `.vscode/cmdrunner.schema.json` and `src/types.ts` must always be in sync. The Zod schema is authoritative; update the JSON Schema to match after every Zod change.

[2025-01-01][schema] Never remove a config key without a two-release deprecation cycle. Add a shim in `configLoader.ts` that maps the old key to the new key and logs a deprecation warning.

[2025-01-01][schema] `display` defaults to `"auto"` — do not assume it will be `"sidebar"` or `"dropdown"` in new code paths.

---

## Testing

[2025-01-01][testing] Use the `createMockContext()` helper in `src/test/suite/` to create a minimal `vscode.ExtensionContext` mock. Do not import `vscode` directly in test utilities.

[2025-01-01][testing] Coverage threshold is 80 % across lines, branches, functions, and statements. Check with `npx c8 check-coverage` before pushing.

[2025-01-01][testing] Tests run inside the VS Code Extension Host via `@vscode/test-electron`. An Xvfb display server is required on Linux CI — see `.github/workflows/ci.yml`.

---

## CI

[2025-01-01][ci] The `ci.yml` workflow runs on every PR to `main` and every push to `main`. It must stay green; never force-merge a failing PR.

[2025-01-01][ci] VSIX packaging uses `--no-dependencies` flag to skip bundling `node_modules`. The extension has no runtime `node_modules` dependencies that aren't already bundled by the VS Code extension host.

[2025-01-01][ci] Release is triggered by pushing a `v*` tag (e.g. `v0.1.0`). Both `VSCE_PAT` and `OVSX_PAT` secrets must be configured in the repository before tagging.

---

## Tooling

[2025-01-01][tooling] Husky + lint-staged run ESLint and Prettier on every commit. The `prepare` npm script installs hooks automatically — no manual `husky install` needed.

[2025-01-01][tooling] commitlint enforces Conventional Commits on every commit message. Valid types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`, `style`, `build`.

[2025-01-01][gotcha] `npm run test:coverage` requires a compiled extension first. The `pretest` script runs `compile` + `lint` automatically, but watch out when running `c8` directly.

---

## UX Decisions

[2025-01-01][decision] Status-bar buttons use `alignment: vscode.StatusBarAlignment.Left` with a priority based on command order, so they appear left-to-right in the order defined in `.cmdrunner`.

[2025-01-01][ux] The `cooldownMs` guard prevents duplicate terminal spawns from rapid button clicks. Default is 1000 ms; power users can lower it to 0 to disable.
