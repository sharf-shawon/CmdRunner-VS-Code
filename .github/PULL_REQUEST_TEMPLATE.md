## Description
<!-- A clear and concise description of what this PR changes and why. -->

Fixes # <!-- issue number, if applicable -->

---

## Checklist

- [ ] **Tests** – new / modified behaviour is covered by tests; `npm test` passes locally
- [ ] **Docs** – relevant docs (`README.md`, `docs/`) updated if behaviour changed
- [ ] **Pre-commit hooks pass** – `npm run lint` and `npm run format:check` pass (`husky` ran on commit)
- [ ] **Conventional commit** – commit messages follow `type(scope): subject` format (enforced by `commitlint`)
- [ ] **Coverage not dropped** – overall line/branch/function/statement coverage remains ≥ 80 %
- [ ] **Schema synced** – if the `.cmdrunner` config schema changed, `.vscode/cmdrunner.schema.json` is updated
- [ ] **No secrets** – no credentials, tokens, or sensitive values are included in this PR
- [ ] **CHANGELOG updated** – an entry has been added under `[Unreleased]` in `CHANGELOG.md`

---

## Type of change
<!-- Delete options that do not apply. -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing behaviour to change)
- [ ] Documentation update
- [ ] Refactor / tech debt
- [ ] CI / tooling

---

## Testing
<!-- Describe how this was tested. -->

```
npm test
```

## Screenshots / recordings (if applicable)
