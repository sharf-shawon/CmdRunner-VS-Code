# Contributing to CmdRunner

Thank you for contributing! This guide covers everything you need to get a
development environment running and submit a high-quality pull request.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20 LTS or later |
| npm | bundled with Node 20 |
| VS Code | 1.90 or later |

---

## Development Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-fork>/CmdRunner-VS-Code.git
cd CmdRunner-VS-Code

# 2. Install dependencies (also installs Husky git hooks)
npm install

# 3. Compile TypeScript in watch mode
npm run watch

# 4. Open the folder in VS Code
code .
```

Press **F5** in VS Code to launch the Extension Development Host with CmdRunner
loaded.

---

## Project Structure

```
src/
  extension.ts        – activation entry point
  configLoader.ts     – parse & validate .cmdrunner / .cmdrunner.yml
  types.ts            – Zod schemas and TypeScript types (source of truth)
  profileManager.ts   – environment profile switching
  terminalRunner.ts   – execute commands in VS Code terminals
  startupRunner.ts    – run startup[] commands on activation
  variableResolver.ts – ${workspaceFolder}, ${env:X}, etc.
  security.ts         – blocked patterns, checksum, workspace trust
  auditLog.ts         – optional audit logging
  statusBar.ts        – status-bar button rendering
  taskBridge.ts       – VS Code Task API integration
  walkthrough.ts      – onboarding walkthrough steps
  test/
    runTests.ts       – test runner entry point
    suite/            – Mocha test suites
.vscode/
  cmdrunner.schema.json  – JSON Schema for .cmdrunner files
docs/                 – architecture, reference, and security docs
```

---

## Pre-commit Hooks

[Husky](https://typicode.github.io/husky/) runs `lint-staged` on every commit:

- **ESLint** auto-fixes TypeScript files
- **Prettier** formats TypeScript files

[commitlint](https://commitlint.js.org/) validates the commit message format.

These hooks are installed automatically by `npm install` via the `prepare` script.

---

## Conventional Commits

All commit messages must follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Valid types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`,
`perf`, `style`, `build`

**Examples:**

```
feat(statusBar): add group separator between commands
fix(security): escape backticks in variable interpolation
docs(config): add checksum field to configuration reference
test(terminalRunner): add reuseTerminal edge-case tests
```

---

## Running Tests

```bash
# Compile + run full test suite
npm test

# Run with coverage report
npm run test:coverage

# Lint only
npm run lint

# Type-check only (no emit)
npx tsc --noEmit
```

---

## Coverage Requirement

Overall line, branch, function, and statement coverage must remain **≥ 80 %**.
The CI pipeline enforces this threshold; PRs that drop coverage below 80 % will
fail.

Check coverage locally:

```bash
npm run test:coverage
npx c8 check-coverage --lines 80 --functions 80 --branches 80 --statements 80
```

---

## PR Checklist

Before opening a pull request, confirm:

- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint` passes
- [ ] Coverage has not dropped below 80 %
- [ ] `CHANGELOG.md` has an entry under `[Unreleased]`
- [ ] If the config schema changed, `.vscode/cmdrunner.schema.json` and
      `docs/configuration-reference.md` are updated
- [ ] No secrets or credentials are included

---

## Updating the Schema

If you add or change a field in `src/types.ts`:

1. Update the Zod schema in `src/types.ts`.
2. Update `.vscode/cmdrunner.schema.json` to match.
3. Update `docs/configuration-reference.md` with type, default, and an example.
4. Add a migration note in `src/configLoader.ts` if an existing key changes.

The **cmdrunner-schema** agent can assist with keeping these in sync.

---

## Asking for Help

- Open a [GitHub Discussion](https://github.com/cmdrunner/CmdRunner-VS-Code/discussions)
  for questions.
- Check `docs/agent-knowledge-base.md` for common patterns and gotchas.
- Tag `@cmdrunner-dev` in a comment for automated agent assistance.
