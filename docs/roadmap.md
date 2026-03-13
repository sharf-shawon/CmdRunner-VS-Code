# Roadmap

This document describes planned features and improvements for CmdRunner.
Items are grouped by target release. The list is not a binding commitment;
priorities may shift based on user feedback.

---

## 0.2.0 – UX Polish

- [ ] **Sidebar panel** – tree view listing all commands grouped by `group`,
      with run / stop buttons inline
- [ ] **Command history** – quick-pick palette showing the last N commands run
      with timestamps and re-run shortcut
- [ ] **Status-bar overflow menu** – `+N more` button opening a dropdown for
      commands beyond `maxVisible`
- [ ] **Inline terminal output** – optional last-line preview next to the
      status-bar button
- [ ] **Stop button** – kill the running process from the status-bar button
      when a command is active

## 0.3.0 – Multi-root & Remote

- [ ] **Multi-root workspace support** – per-folder `.cmdrunner` files with
      a merged view in the sidebar
- [ ] **Remote SSH / Dev Containers** – full functionality when connected via
      VS Code Remote extensions
- [ ] **Profile import / export** – share profiles across machines via a JSON
      snippet

## 0.4.0 – Advanced Commands

- [ ] **Command chaining** – `dependsOn` with wait-for-success semantics
      (currently best-effort)
- [ ] **Parameterised commands** – `${input:X}` with type hints (number, enum,
      file picker)
- [ ] **Command groups as macros** – run all commands in a group with one click
- [ ] **Parallel execution display** – progress indicators for parallel startup
      commands

## 0.5.0 – AI Integration

- [ ] **Natural-language command creation** – describe a task in plain English;
      Copilot generates the `.cmdrunner` entry
- [ ] **Smart blocked-patterns suggestions** – analyse existing commands and
      suggest security-relevant blocked patterns
- [ ] **Auto-checksum generation** – Copilot adds a `checksum` field whenever
      a destructive command is detected

## 1.0.0 – Stable Release

- [ ] All 0.x features stabilised
- [ ] Full documentation coverage
- [ ] 90 %+ test coverage
- [ ] Published on VS Code Marketplace and Open VSX
- [ ] Signed VSIX artifact

---

## Completed

### 0.1.0 – Initial Release ✅

- Status-bar buttons from `.cmdrunner` / `.cmdrunner.yml`
- Environment profiles with `activeProfile`
- Startup commands (`startup[]`)
- Variable interpolation (`${env:X}`, `${workspaceFolder}`, `${input:X}`)
- Security: workspace trust, blocked patterns, checksum verification
- Audit log (opt-in)
- VS Code Task bridge (`type: cmdrunner`)
- Onboarding walkthrough
- JSON Schema for `.cmdrunner` with editor auto-complete

---

## Feedback

Have an idea not listed here? Open a
[Feature Request](https://github.com/cmdrunner/CmdRunner-VS-Code/issues/new?template=feature_request.yml).
