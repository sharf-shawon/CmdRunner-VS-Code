# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.1.x | ✅ Active support |
| < 0.1.0 | ❌ Not supported |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

All security reports should be made through **GitHub's private vulnerability
reporting** feature:

1. Go to the repository's **Security** tab.
2. Click **"Report a vulnerability"**.
3. Fill in the form with as much detail as possible.

Alternatively, email the maintainers at the address listed in `package.json`.

### What to include

- A clear description of the vulnerability.
- Steps to reproduce (proof-of-concept if available).
- The impact and attack scenario.
- VS Code version, extension version, and operating system.

---

## Response SLA

| Milestone | Target |
|---|---|
| Acknowledgement | Within **48 hours** of report |
| Triage and severity assignment | Within **5 business days** |
| Patch for **critical** / **high** | Within **7 days** of confirmation |
| Patch for **medium** | Within **30 days** of confirmation |
| Patch for **low** | Next planned release |
| Public disclosure | Coordinated with reporter after patch is released |

We follow a **coordinated disclosure** model. We will not disclose details of a
vulnerability until a patch has been released, unless the reporter requests
otherwise or the vulnerability is already publicly known.

---

## Scope

The following are **in scope**:

- Remote code execution via malicious `.cmdrunner` configuration
- Bypass of workspace trust checks
- Bypass of `blockedPatterns` validation
- Checksum verification bypass
- Secret/credential leakage through the UI, audit log, or network requests
- Privilege escalation via the VS Code Task bridge

The following are **out of scope**:

- Vulnerabilities in VS Code itself (report to Microsoft)
- Vulnerabilities in third-party npm dependencies (report upstream and to the
  GitHub Advisory Database)
- Social engineering attacks

---

## Security Best Practices for Users

> ⚠️ **Never store secrets, passwords, or API keys in `.cmdrunner`.**
> Use `${env:SECRET_NAME}` to reference environment variables injected through
> your shell profile, CI pipeline, or a secrets manager.

> ⚠️ **Always add `.cmdrunner.local` and `.cmdrunner.local.yml` to `.gitignore`.**
> These user-local override files may contain personal environment values and
> must never be committed to source control.

Other recommendations:
- Enable `cmdrunner.auditLog` in regulated environments.
- Use `checksum` fields for commands that deploy to production or perform
  destructive operations.
- Review `cmdrunner.blockedPatterns` when opening unfamiliar workspaces.

---

## Known Security Controls

See [docs/security.md](docs/security.md) for a full description of CmdRunner's
defence-in-depth security model including workspace trust, blocked patterns,
checksum verification, secret masking, and variable interpolation escaping.
