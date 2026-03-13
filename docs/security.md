# Security Model

CmdRunner is designed with a defence-in-depth security model. This document
describes every security control, the threat it mitigates, and how it is
implemented.

---

## Workspace Trust

**Threat:** A malicious repository could include a `.cmdrunner` file that
auto-runs harmful commands when the workspace is opened.

**Control:** CmdRunner checks `vscode.workspace.isTrusted` before executing
any command, including startup commands. In an untrusted workspace:
- All status-bar buttons are hidden.
- Startup commands are not run.
- A notification informs the user that CmdRunner is disabled until trust is
  granted.

This behaviour aligns with the [VS Code Workspace Trust](https://code.visualstudio.com/docs/editor/workspace-trust)
model and cannot be disabled.

---

## Blocked Patterns

**Threat:** A compromised or misconfigured `.cmdrunner` file could run
destructive commands (e.g. `rm -rf /`).

**Control:** The `cmdrunner.blockedPatterns` VS Code setting accepts an array
of glob or regex patterns. Commands whose resolved string matches any blocked
pattern are rejected before execution, and a warning is shown to the user.

The blocked-patterns list is defined in VS Code settings (not in `.cmdrunner`
itself), so a workspace owner cannot override it.

```json
// .vscode/settings.json (workspace) or settings.json (user)
{
  "cmdrunner.blockedPatterns": [
    "rm -rf*",
    "sudo *",
    "curl * | *sh"
  ]
}
```

---

## Checksum Verification

**Threat:** An attacker with write access to the repository modifies a command
after it was reviewed and approved.

**Control:** Each command entry can include an optional `checksum` field
containing the SHA-256 hex digest of the `command` string. When present,
CmdRunner computes the hash of the resolved command and compares it to the
stored value. If they do not match, execution is refused and the user is
notified.

Generate a checksum:

```bash
echo -n "npm run build" | sha256sum
```

---

## Audit Log

**Threat:** Lack of visibility into which commands were run, by whom, and when.

**Control:** When `cmdrunner.auditLog` is `true` in VS Code settings, every
command execution is logged to a local file (`~/.cmdrunner/audit.log`) with:
- ISO 8601 timestamp
- Workspace path
- Command `id` and `label`
- Resolved command string (**secrets masked** — see below)
- Exit status (where available)

The audit log file path is intentionally outside the workspace to prevent it
from being committed. It is also listed in `.gitignore` by default.

> ⚠️ **Never commit audit logs.** They may contain partial command strings that
> reveal infrastructure details.

---

## Secret Masking

**Threat:** Secrets passed via `${env:SECRET}` appearing in tooltips, notifications,
or log files.

**Control:**
- All `${env:X}` substitutions are masked as `***` in the VS Code UI (tooltips,
  history panel, notifications).
- Audit log entries replace `${env:X}` expansions with `[REDACTED:X]`.
- The raw environment variable value is **never** stored to disk.

---

## Variable Interpolation Escaping

**Threat:** Shell injection via user-controlled variable values containing
metacharacters (`;`, `|`, `&`, `` ` ``, `$`, etc.).

**Control:** By default, `variableResolver.ts` escapes shell metacharacters in
all substituted values before inserting them into the command string. This
prevents injected payloads from being interpreted by the shell.

Commands that legitimately need unescaped substitution can opt in per-command:

```yaml
- id: run-script
  command: "bash ${input:scriptPath}"
  unsafeInterpolation: true  # documented risk; generates an audit-log warning
```

Use `unsafeInterpolation` only for values you fully control.

---

## Recommendations

1. **Never store secrets in `.cmdrunner`.** Use `${env:SECRET}` and inject
   values through your shell profile, CI secrets, or a secrets manager.
2. **Always gitignore `.cmdrunner.local` and `.cmdrunner.local.yml`.** These
   user-local overrides may contain personal environment values.
3. **Review blocked patterns** when onboarding a new workspace, especially in
   shared or open-source projects.
4. **Enable audit logging** in regulated environments or when debugging
   unexpected command executions.
5. **Use checksums** for commands that involve destructive operations or deploy
   to production.

---

## Reporting Vulnerabilities

See [SECURITY.md](../SECURITY.md) for the vulnerability disclosure policy.
