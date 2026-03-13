# Changelog

All notable changes to CmdRunner are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

*(No unreleased changes yet.)*

---

## [0.1.0] – 2025-01-01

### Added

- Status-bar buttons rendered from `.cmdrunner` (JSON) and `.cmdrunner.yml` (YAML) workspace config files
- Environment profiles (`profiles`) with instant switching via **CmdRunner: Switch Profile** command
- Startup commands (`startup[]`) that run automatically on workspace activation, supporting both `sequential` and `parallel` modes
- Variable interpolation: `${workspaceFolder}`, `${workspaceFolderBasename}`, `${env:X}`, `${input:X}`, `${activeFile}`, `${activeFileBasename}`, `${activeFileDirname}`, `${profile:KEY}`
- Security controls:
  - Workspace trust enforcement (commands blocked in untrusted workspaces)
  - `blockedPatterns` glob/regex list (configured in VS Code settings)
  - SHA-256 checksum verification per command
  - Shell metacharacter escaping in interpolated values
  - Secret masking in UI and audit log
- Optional audit log (`cmdrunner.auditLog` setting) written to `~/.cmdrunner/audit.log`
- VS Code Task bridge: `type: cmdrunner` custom task provider for use in `tasks.json` and `preLaunchTask`
- **CmdRunner: Initialize Config** command to scaffold a `.cmdrunner` file
- **CmdRunner: Validate Config** command to surface parse/validation errors
- **CmdRunner: Show History** command to review recent command executions
- **CmdRunner: Run Command** command to trigger a command by `id`
- Onboarding walkthrough (three steps: initialize, add command, use profiles)
- JSON Schema (`.vscode/cmdrunner.schema.json`) for editor auto-complete and inline validation
- `cooldownMs` guard to prevent duplicate executions from rapid button clicks
- `dependsOn` field for basic command ordering
- Per-command `env`, `cwd`, `terminal`, `color`, `group`, and `terminalProfile` overrides
- Full test suite with ≥ 80 % line/branch/function/statement coverage
- CI pipeline: lint → type-check → test → coverage → VSIX dry-run
- Nightly regression tests against VS Code stable, 1.95, and 1.90

[Unreleased]: https://github.com/cmdrunner/CmdRunner-VS-Code/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cmdrunner/CmdRunner-VS-Code/releases/tag/v0.1.0
