# Configuration Reference

Complete reference for every key in the `.cmdrunner` (JSON) or `.cmdrunner.yml` (YAML)
configuration file.

---

## Root keys

### `$schema`

| | |
|---|---|
| **Type** | `string` |
| **Default** | *(none)* |
| **Required** | No |

URL to the JSON Schema for editor auto-complete and validation.

```json
{ "$schema": "./.vscode/cmdrunner.schema.json" }
```

---

### `display`

| | |
|---|---|
| **Type** | `"auto" \| "sidebar" \| "dropdown"` |
| **Default** | `"auto"` |
| **Required** | No |

Controls how commands are presented when there are more entries than `maxVisible`.

| Value | Behaviour |
|---|---|
| `"auto"` | Status-bar buttons up to `maxVisible`; overflow hidden |
| `"sidebar"` | All commands listed in a dedicated sidebar panel |
| `"dropdown"` | A quick-pick dropdown lists all commands |

```yaml
display: dropdown
```

---

### `maxVisible`

| | |
|---|---|
| **Type** | `integer` (1 – 20) |
| **Default** | `5` |
| **Required** | No |

Maximum number of status-bar buttons displayed simultaneously.

```json
{ "maxVisible": 8 }
```

---

### `terminalProfile`

| | |
|---|---|
| **Type** | `string` |
| **Default** | `"default"` |
| **Required** | No |

The VS Code terminal profile name to use for all commands unless overridden
per-command with `commands[].terminalProfile`.

```yaml
terminalProfile: "Git Bash"
```

---

### `startupMode`

| | |
|---|---|
| **Type** | `"sequential" \| "parallel"` |
| **Default** | `"sequential"` |
| **Required** | No |

Controls how `startup` commands are executed when the workspace opens.

```yaml
startupMode: parallel
```

---

### `cooldownMs`

| | |
|---|---|
| **Type** | `integer` (≥ 0) |
| **Default** | `1000` |
| **Required** | No |

Minimum milliseconds between consecutive executions of the same command.
Prevents accidental double-clicks from spawning duplicate processes.

```yaml
cooldownMs: 500
```

---

### `profiles`

| | |
|---|---|
| **Type** | `Record<string, Profile>` |
| **Default** | `{}` |
| **Required** | No |

Named environment profiles. Each profile is an object with an `env` map.
Switch profiles via the **CmdRunner: Switch Profile** command.

```yaml
profiles:
  dev:
    env:
      NODE_ENV: development
      API_URL: http://localhost:3000
  prod:
    env:
      NODE_ENV: production
      API_URL: https://api.example.com
```

---

### `activeProfile`

| | |
|---|---|
| **Type** | `string` |
| **Default** | *(none — falls back to `cmdrunner.defaultProfile` VS Code setting)* |
| **Required** | No |

The profile that is active when the workspace opens.

```yaml
activeProfile: dev
```

---

### `startup`

| | |
|---|---|
| **Type** | `StartupCommand[]` |
| **Default** | `[]` |
| **Required** | No |

Commands that run automatically on workspace activation. Each entry has:

| Key | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | ✅ | Human-readable name shown in notifications |
| `command` | `string` | ✅ | Shell command to execute |

```yaml
startup:
  - label: Start dev server
    command: npm run dev
  - label: Start database
    command: docker compose up -d db
```

---

### `commands`

| | |
|---|---|
| **Type** | `CommandConfig[]` |
| **Default** | `[]` |
| **Required** | No |

The list of commands rendered as status-bar buttons.

---

## Command entry (`commands[]`)

### `id`

| | |
|---|---|
| **Type** | `string` |
| **Required** | ✅ |

Unique identifier for the command. Used for `dependsOn` references and the
VS Code Task bridge.

```yaml
id: run-tests
```

---

### `label`

| | |
|---|---|
| **Type** | `string` |
| **Required** | ✅ |

Text displayed on the status-bar button. Supports [ThemeIcons](https://code.visualstudio.com/api/references/icons-in-labels)
via `$(icon-name)` syntax.

```yaml
label: "$(beaker) Test"
```

---

### `command`

| | |
|---|---|
| **Type** | `string` |
| **Required** | ✅ |

Shell command to execute. Supports variable interpolation (see [Variable Interpolation](#variable-interpolation)).

```yaml
command: "npm test -- --coverage"
```

---

### `terminal`

| | |
|---|---|
| **Type** | `string` |
| **Default** | *(auto-generated from `id`)* |
| **Required** | No |

Name of the VS Code terminal panel to use. Multiple commands sharing the same
`terminal` name will reuse that terminal (subject to `reuseTerminal`).

```yaml
terminal: "Dev Server"
```

---

### `group`

| | |
|---|---|
| **Type** | `string` |
| **Default** | *(none)* |
| **Required** | No |

Logical grouping label. Used in the sidebar / dropdown views to group related
commands under a collapsible heading.

```yaml
group: "Testing"
```

---

### `cwd`

| | |
|---|---|
| **Type** | `string` |
| **Default** | workspace root |
| **Required** | No |

Working directory for the command. Supports `${workspaceFolder}` interpolation.

```yaml
cwd: "${workspaceFolder}/packages/api"
```

---

### `color`

| | |
|---|---|
| **Type** | `string` (CSS hex or VS Code theme color ID) |
| **Default** | *(status bar foreground)* |
| **Required** | No |

Foreground colour of the status-bar button.

```yaml
color: "#ff6b6b"
```

---

### `reuseTerminal`

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `true` |
| **Required** | No |

When `true`, the command reuses an existing terminal with the same `terminal`
name rather than spawning a new one.

---

### `keybinding`

| | |
|---|---|
| **Type** | `string` |
| **Default** | *(none)* |
| **Required** | No |

VS Code keybinding string registered for this command (e.g. `"ctrl+shift+t"`).

---

### `dependsOn`

| | |
|---|---|
| **Type** | `string[]` |
| **Default** | `[]` |
| **Required** | No |

List of command `id`s that must complete before this command runs.

```yaml
dependsOn: [build]
```

---

### `env`

| | |
|---|---|
| **Type** | `Record<string, string>` |
| **Default** | `{}` |
| **Required** | No |

Per-command environment variable overrides. Merged on top of the active profile
environment.

```yaml
env:
  PORT: "4000"
```

---

### `checksum`

| | |
|---|---|
| **Type** | `string` (SHA-256 hex) |
| **Default** | *(none)* |
| **Required** | No |

SHA-256 hash of the `command` string. When present, the extension verifies the
hash before execution and refuses to run if the command has been tampered with.

```yaml
checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
```

---

### `terminalProfile`

| | |
|---|---|
| **Type** | `string` |
| **Default** | *(inherits root `terminalProfile`)* |
| **Required** | No |

Override the VS Code terminal profile for this specific command.

```yaml
terminalProfile: "PowerShell"
```

---

## Variable Interpolation

The following variables are available in `command`, `cwd`, and `env` values:

| Variable | Resolved value |
|---|---|
| `${workspaceFolder}` | Absolute path to the workspace root |
| `${workspaceFolderBasename}` | Basename of the workspace root directory |
| `${env:NAME}` | Environment variable `NAME` (masked in logs) |
| `${input:NAME}` | Prompts the user for a value at runtime |
| `${activeFile}` | Absolute path of the currently active editor file |
| `${activeFileBasename}` | Basename of the active file |
| `${activeFileDirname}` | Directory of the active file |
| `${profile:KEY}` | Value of `KEY` from the active profile's `env` map |

---

## VS Code settings (`settings.json`)

These settings are configured in VS Code's `settings.json`, not in `.cmdrunner`.

| Setting | Type | Default | Description |
|---|---|---|---|
| `cmdrunner.maxVisible` | `number` | `5` | Overrides root `maxVisible` for the current VS Code instance |
| `cmdrunner.blockedPatterns` | `string[]` | `[]` | Glob/regex patterns of commands that are blocked |
| `cmdrunner.defaultProfile` | `string` | `"default"` | Profile activated on startup |
| `cmdrunner.auditLog` | `boolean` | `false` | Enable audit logging |
| `cmdrunner.display` | `object` | `{}` | Per-command display overrides (`icon`, `color`, `tooltip`) |
