# CmdRunner

> Configure and run terminal commands from clickable status-bar buttons in VS Code.

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/cmdrunner.cmdrunner?label=marketplace&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=cmdrunner.cmdrunner)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/cmdrunner.cmdrunner)](https://marketplace.visualstudio.com/items?itemName=cmdrunner.cmdrunner)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/cmdrunner.cmdrunner)](https://marketplace.visualstudio.com/items?itemName=cmdrunner.cmdrunner)
[![Build](https://github.com/cmdrunner/CmdRunner-VS-Code/actions/workflows/ci.yml/badge.svg)](https://github.com/cmdrunner/CmdRunner-VS-Code/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-≥80%25-brightgreen)](https://github.com/cmdrunner/CmdRunner-VS-Code/actions)

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Full Configuration Reference](#2-full-configuration-reference)
3. [Startup Commands](#3-startup-commands)
4. [Environment Profiles](#4-environment-profiles)
5. [Display Modes](#5-display-modes)
6. [Terminal Profiles](#6-terminal-profiles)
7. [Variable Interpolation](#7-variable-interpolation)
8. [Security Model](#8-security-model)
9. [VS Code Task Bridge](#9-vs-code-task-bridge)
10. [AI Agent Onboarding](#10-ai-agent-onboarding)
11. [Contributing](#11-contributing)
12. [License](#12-license)

---

## 1. Quick Start

**Under 60 seconds** — from install to your first button:

1. Install **CmdRunner** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cmdrunner.cmdrunner).

2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:
   ```
   CmdRunner: Initialize Config
   ```
   This creates a `.cmdrunner` file in your workspace root.

3. Edit `.cmdrunner` to add your first command:
   ```json
   {
     "$schema": "./.vscode/cmdrunner.schema.json",
     "commands": [
       {
         "id": "test",
         "label": "$(beaker) Test",
         "command": "npm test"
       }
     ]
   }
   ```

4. Save the file. A **$(beaker) Test** button appears in the status bar. Click it to run.

---

## 2. Full Configuration Reference

The `.cmdrunner` file supports JSON or YAML format. All keys are optional unless marked ✅.

### Root keys

| Key | Type | Default | Description |
|---|---|---|---|
| `$schema` | `string` | – | Path to JSON Schema for editor auto-complete |
| `display` | `"auto"\|"sidebar"\|"dropdown"` | `"auto"` | How commands are presented |
| `maxVisible` | `integer` | `5` | Max status-bar buttons (1–20) |
| `terminalProfile` | `string` | `"default"` | VS Code terminal profile for all commands |
| `startupMode` | `"sequential"\|"parallel"` | `"sequential"` | Startup command execution order |
| `cooldownMs` | `integer` | `1000` | Min ms between repeated executions |
| `profiles` | `Record<string, Profile>` | `{}` | Named environment profiles |
| `activeProfile` | `string` | – | Profile to activate on open |
| `startup` | `StartupCommand[]` | `[]` | Commands run on workspace activation |
| `commands` | `CommandConfig[]` ✅ | `[]` | Status-bar command entries |

### Command entry keys

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | `string` ✅ | – | Unique identifier |
| `label` | `string` ✅ | – | Status-bar button text (supports `$(icon)`) |
| `command` | `string` ✅ | – | Shell command to run |
| `terminal` | `string` | auto | Terminal panel name |
| `group` | `string` | – | Grouping label for sidebar/dropdown |
| `cwd` | `string` | workspace root | Working directory |
| `color` | `string` | – | Button foreground colour (hex or theme colour) |
| `reuseTerminal` | `boolean` | `true` | Reuse existing terminal with same name |
| `keybinding` | `string` | – | VS Code keybinding (e.g. `"ctrl+shift+t"`) |
| `dependsOn` | `string[]` | `[]` | IDs of commands to complete first |
| `env` | `Record<string, string>` | `{}` | Per-command environment overrides |
| `checksum` | `string` | – | SHA-256 hex of `command` for tamper detection |
| `terminalProfile` | `string` | root value | Per-command terminal profile override |

For the complete reference with examples, see
[docs/configuration-reference.md](docs/configuration-reference.md).

---

## 3. Startup Commands

Commands under `startup` run automatically when the workspace opens.

```yaml
# .cmdrunner.yml
startupMode: parallel
startup:
  - label: Start dev server
    command: npm run dev
  - label: Start database
    command: docker compose up -d db
```

- **`sequential`** (default) – each command waits for the previous to finish.
- **`parallel`** – all commands start simultaneously.

Startup commands respect workspace trust — they will not run in untrusted workspaces.

---

## 4. Environment Profiles

Profiles let you switch between different sets of environment variables without
changing your commands.

```yaml
profiles:
  dev:
    env:
      NODE_ENV: development
      API_URL: http://localhost:3000
  staging:
    env:
      NODE_ENV: production
      API_URL: https://staging.example.com

activeProfile: dev

commands:
  - id: deploy
    label: "$(cloud-upload) Deploy"
    command: ./scripts/deploy.sh
```

Switch profiles with **CmdRunner: Switch Profile** from the Command Palette.
The active profile is shown in the status bar.

---

## 5. Display Modes

Control how commands are presented with the `display` root key:

| Mode | Description |
|---|---|
| `"auto"` | Status-bar buttons up to `maxVisible`; extra commands hidden |
| `"sidebar"` | All commands listed in a dedicated sidebar tree view |
| `"dropdown"` | A quick-pick dropdown lists all commands on demand |

```yaml
display: dropdown
maxVisible: 8
```

---

## 6. Terminal Profiles

Direct commands to specific terminal shells using VS Code's terminal profiles.

```yaml
# Use Git Bash for all commands by default
terminalProfile: "Git Bash"

commands:
  - id: powershell-task
    label: "$(terminal-powershell) PS Task"
    command: Get-ChildItem
    terminalProfile: PowerShell   # override for this command only
```

Terminal profile names must match those configured in
`terminal.integrated.profiles.*` in VS Code settings.

---

## 7. Variable Interpolation

Use these variables in `command`, `cwd`, and `env` values:

| Variable | Resolved value |
|---|---|
| `${workspaceFolder}` | Absolute path to the workspace root |
| `${workspaceFolderBasename}` | Basename of the workspace root |
| `${env:NAME}` | Environment variable `NAME` (masked in logs & UI) |
| `${input:NAME}` | Prompts the user for a value at runtime |
| `${activeFile}` | Absolute path of the active editor file |
| `${activeFileBasename}` | Basename of the active file |
| `${activeFileDirname}` | Directory of the active file |
| `${profile:KEY}` | Value of `KEY` from the active profile's `env` map |

**Example:**

```yaml
commands:
  - id: open-pr
    label: "$(git-pull-request) Open PR"
    command: "gh pr create --base main --head ${input:branchName}"
```

> ⚠️ Shell metacharacters in substituted values are **escaped by default**.
> Set `unsafeInterpolation: true` on a command only when you need raw variable
> expansion and fully trust the input source.

---

## 8. Security Model

CmdRunner is built with defence-in-depth. Key controls:

| Control | Description |
|---|---|
| **Workspace trust** | All commands blocked in untrusted workspaces |
| **Blocked patterns** | `cmdrunner.blockedPatterns` in VS Code settings blocks matching commands |
| **Checksum verification** | SHA-256 `checksum` field detects command tampering |
| **Secret masking** | `${env:X}` values are never shown in the UI or written to logs |
| **Interpolation escaping** | Metacharacters escaped in variable values by default |
| **Audit log** | Optional timestamped log at `~/.cmdrunner/audit.log` |

> ⚠️ **Never store secrets in `.cmdrunner`.** Use `${env:SECRET}` and inject
> values through your shell profile or a secrets manager.
>
> **Always add `.cmdrunner.local` and `.cmdrunner.local.yml` to `.gitignore`.**

For the full security model, see [docs/security.md](docs/security.md).  
For the vulnerability disclosure policy, see [SECURITY.md](SECURITY.md).

---

## 9. VS Code Task Bridge

CmdRunner commands are available as VS Code tasks, enabling use in
`tasks.json` and `preLaunchTask` in `launch.json`.

**`tasks.json` example:**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "cmdrunner",
      "command": "run-tests",
      "label": "CmdRunner: Run Tests",
      "group": { "kind": "test", "isDefault": true }
    }
  ]
}
```

**`launch.json` example:**

```json
{
  "preLaunchTask": "CmdRunner: Run Tests"
}
```

The `command` property must match the `id` of a command in your `.cmdrunner`
file. An optional `profile` property overrides the active profile for that
task invocation.

---

## 10. AI Agent Onboarding

CmdRunner ships with pre-configured AI agent definitions in `.agents.md`:

| Agent | Role |
|---|---|
| `cmdrunner-dev` | TypeScript source code implementation and bug fixes |
| `cmdrunner-docs` | Documentation, configuration reference, changelog |
| `cmdrunner-schema` | Keep JSON Schema and Zod schemas in sync |
| `cmdrunner-release` | Version bumps, tagging, and publishing |

Copilot instructions are in `.github/copilot-instructions.md` (9 rules covering
schema-first development, security, conventional commits, coverage, terminal
safety, and more).

The living knowledge base at `docs/agent-knowledge-base.md` is updated weekly
by the `agent-learn` workflow, which scans merged PRs and closed issues.

---

## 11. Contributing

See [docs/contributing.md](docs/contributing.md) for the full guide.

**Quick summary:**

```bash
git clone https://github.com/<your-fork>/CmdRunner-VS-Code.git
cd CmdRunner-VS-Code
npm install       # installs deps + Husky git hooks
npm run watch     # TypeScript in watch mode
# Press F5 in VS Code to launch Extension Development Host
```

- Tests: `npm test`
- Coverage: `npm run test:coverage` (must stay ≥ 80 %)
- Lint: `npm run lint`
- Commits must follow [Conventional Commits](https://www.conventionalcommits.org/)
- Update `CHANGELOG.md` under `[Unreleased]` for every change

---

## 12. License

[MIT](LICENSE) © CmdRunner contributors
