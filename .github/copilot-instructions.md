# GitHub Copilot Instructions – CmdRunner VS Code Extension

These instructions apply to all Copilot interactions in this repository.

---

## Rule 1 – Always read the schema first

Before suggesting any changes to `.cmdrunner` config handling, load and review
`.vscode/cmdrunner.schema.json`. All config keys, types, and defaults must
remain consistent with that schema. If a change requires a schema update,
update both the schema and `src/types.ts` (Zod) together.

## Rule 2 – Security model is non-negotiable

- Commands are validated against `blockedPatterns` before execution.
- Checksums (`checksum` field) must be verified for commands that declare them.
- Workspace trust (`vscode.workspace.isTrusted`) must be checked before running
  any command; refuse execution in untrusted workspaces with a clear error.
- Never store secrets in `.cmdrunner`. Always mask `${env:SECRET}` values in
  audit logs and UI tooltips.

## Rule 3 – Conventional commits & changelog

All commit messages must follow the Conventional Commits spec
(`type(scope): subject`). Valid types: `feat`, `fix`, `docs`, `refactor`,
`test`, `chore`, `ci`, `perf`, `style`, `build`. After every functional change,
append an entry under `[Unreleased]` in `CHANGELOG.md`.

## Rule 4 – Coverage gate

Overall line, branch, function, and statement coverage must stay at or above
**80 %**. When adding new source code, always add corresponding unit tests.
Tests live in `src/test/suite/`. Use the existing `createMockContext()` helper.

## Rule 5 – No breaking changes without a migration path

If a config key is renamed or removed, add a backward-compatibility shim in
`src/configLoader.ts` and document the migration in `docs/configuration-reference.md`.
Bump the minor version for deprecations, the major version for hard breaks.

## Rule 6 – Terminal safety

- Always escape user-supplied variable values before interpolation.
- Never allow shell metacharacters (`; | & $ \`` etc.) to leak from variable
  substitution into the executed command string unless the user explicitly
  marks the command with `"unsafeInterpolation": true`.
- Log a warning to the audit log whenever `unsafeInterpolation` is used.

## Rule 7 – Agent-friendly documentation

Every public function and exported type must have a JSDoc comment. Architectural
decisions belong in `docs/architecture.md`. Recurring patterns and gotchas
should be appended to `docs/agent-knowledge-base.md` with a dated entry:
`[YYYY-MM-DD][category] Description`.

## Rule 8 – Dependency hygiene

Before adding a new `npm` dependency:
1. Check the GitHub Advisory Database for known CVEs.
2. Prefer packages with > 1 M weekly downloads and active maintenance.
3. Add the package to the dependency-review allow-list if needed.
4. Document the reason for the dependency in the PR description.

## Rule 9 – CI must stay green

Never merge a PR that has failing CI checks. The `ci.yml` workflow must pass
(lint → type-check → test → coverage → VSIX dry-run). If a test is flaky, fix
the flakiness rather than skipping the test.
