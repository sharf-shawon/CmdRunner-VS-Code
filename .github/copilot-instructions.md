# Copilot Instructions for CmdRunner-VS-Code

## Project Overview

**CmdRunner** is a Visual Studio Code extension that allows developers to configure and run terminal commands directly from clickable buttons in the VS Code status bar. Users define commands in their workspace settings, and the extension renders them as interactive status bar items that execute the configured commands in a VS Code terminal when clicked.

## Repository Information

- **Type**: VS Code Extension
- **Language**: TypeScript
- **Runtime**: Node.js (via VS Code Extension Host)
- **Framework**: VS Code Extension API (`vscode`)
- **Packaging**: `vsce` (Visual Studio Code Extensions CLI)
- **Build tool**: webpack or esbuild (bundling extension source)
- **Test framework**: Mocha with `@vscode/test-electron`

## Project Layout

```
.
├── .github/
│   └── copilot-instructions.md   # This file
├── .vscode/
│   ├── extensions.json           # Recommended extensions for development
│   ├── launch.json               # Debug/run configurations
│   └── settings.json             # Workspace settings
├── src/
│   └── extension.ts              # Main extension entry point (activate/deactivate)
├── test/
│   └── suite/
│       ├── index.ts              # Test suite runner
│       └── extension.test.ts     # Extension tests
├── .vscodeignore                 # Files excluded from the packaged extension
├── .eslintrc.json                # ESLint configuration
├── package.json                  # Extension manifest and npm dependencies
├── tsconfig.json                 # TypeScript compiler configuration
├── webpack.config.js             # Webpack bundler configuration (if used)
├── CHANGELOG.md                  # Release notes
├── LICENSE                       # License file
└── README.md                     # Extension documentation
```

> **Note**: The repository is in early setup. Not all files above may exist yet. If a file is missing, create it following VS Code extension conventions.

## Key Files

- **`package.json`**: The extension manifest. Defines `contributes.configuration` for user-defined commands, `activationEvents`, `main` entry point, `engines.vscode` version, and npm scripts (`compile`, `watch`, `test`, `package`).
- **`src/extension.ts`**: Extension entry point. Exports `activate(context)` and `deactivate()`. Reads workspace configuration for user-defined commands, registers status bar items, and sets up command handlers using `vscode.window.createStatusBarItem` and `vscode.commands.registerCommand`.
- **`tsconfig.json`**: TypeScript config targeting ES2020 with `"module": "commonjs"`.

## Build & Development Workflow

### Bootstrap (first time setup)
```bash
npm install
```

### Compile TypeScript
```bash
npm run compile
```

### Watch mode (auto-recompile on save)
```bash
npm run watch
```

### Run Extension (debug)
Press **F5** in VS Code to launch the Extension Development Host with the extension loaded.

### Lint
```bash
npm run lint
```

### Run Tests
```bash
npm run test
```
> Tests run inside a VS Code instance using `@vscode/test-electron`. The test runner bootstraps a VS Code window and executes the Mocha test suite in `test/suite/`.

### Package Extension
```bash
npm run package
# or
npx vsce package
```
This produces a `.vsix` file that can be installed locally.

### Publish (maintainers only)
```bash
npx vsce publish
```

## Coding Conventions

- **Language**: All source files use **TypeScript** with strict mode enabled.
- **Formatting**: Follow existing code style; use `prettier` if configured.
- **Linting**: ESLint with `@typescript-eslint` rules. Always run `npm run lint` before committing.
- **Imports**: Use VS Code API as `import * as vscode from 'vscode'`. Avoid adding unnecessary dependencies.
- **Configuration**: User-configurable settings are declared under `contributes.configuration` in `package.json` with descriptive titles and default values.
- **Commands**: All VS Code commands contributed by the extension are prefixed with `cmdrunner.` and declared under `contributes.commands` in `package.json`.
- **Status Bar**: Status bar items are created with `vscode.window.createStatusBarItem` and disposed via `context.subscriptions`.

## Architecture Notes

- The extension activates on VS Code startup (`"activationEvents": ["*"]` or `"onStartupFinished"`).
- It reads configuration from `vscode.workspace.getConfiguration('cmdrunner')` to get the user-defined list of commands.
- Each command entry maps to a status bar item; clicking the item triggers `vscode.commands.executeCommand('workbench.action.terminal.sendSequence', ...)` or opens a terminal and sends the command.
- Configuration changes are handled via `vscode.workspace.onDidChangeConfiguration` to update status bar items dynamically.

## CI / Validation

- Always run `npm run compile` and `npm run lint` after making changes.
- Run `npm run test` to execute the test suite.
- Ensure the extension packages cleanly with `npx vsce package` before submitting a PR.
- Trust the instructions above; only search the codebase if something appears missing or incorrect.
