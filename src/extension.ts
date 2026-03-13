import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader } from './configLoader';
import { TerminalRunner } from './terminalRunner';
import { StatusBarManager } from './statusBar';
import { StartupRunner } from './startupRunner';
import { SecurityManager } from './security';
import { AuditLog } from './auditLog';
import { ProfileManager } from './profileManager';
import { CmdRunnerTaskProvider } from './taskBridge';
import { WalkthroughManager } from './walkthrough';
import { CmdRunnerConfig, CommandConfig } from './types';

/** Default `.cmdrunner` template written by `cmdrunner.initialize`. */
const INIT_TEMPLATE = JSON.stringify(
  {
    $schema: '.vscode/cmdrunner.schema.json',
    display: 'auto',
    maxVisible: 5,
    commands: [
      {
        id: 'example',
        label: 'Example',
        command: 'echo Hello from CmdRunner!',
      },
    ],
  },
  null,
  2
);

/** History of recently-run command IDs (most-recent first, capped at 20). */
const history: string[] = [];

/**
 * Adds `commandId` to the execution history, deduplicating and capping at 20.
 */
function recordHistory(commandId: string): void {
  const idx = history.indexOf(commandId);
  if (idx !== -1) {
    history.splice(idx, 1);
  }
  history.unshift(commandId);
  if (history.length > 20) {
    history.pop();
  }
}

/**
 * Extension entry point.  Creates all managers, loads configuration, registers
 * commands and providers, and starts any startup commands.
 *
 * @param context The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // ── Managers ──────────────────────────────────────────────────────────────
  const configLoader = new ConfigLoader();
  const terminalRunner = new TerminalRunner();
  const statusBarManager = new StatusBarManager(terminalRunner);
  const startupRunner = new StartupRunner();
  const securityManager = new SecurityManager();
  const profileManager = new ProfileManager();
  const walkthrough = new WalkthroughManager();

  const vsConfig = vscode.workspace.getConfiguration('cmdrunner');
  const auditLog = new AuditLog(vsConfig.get<boolean>('auditLog') ?? false);

  // Dispose everything when the extension is deactivated.
  context.subscriptions.push(
    { dispose: () => configLoader.dispose() },
    { dispose: () => terminalRunner.dispose() },
    { dispose: () => statusBarManager.dispose() }
  );

  // ── Workspace trust gate ──────────────────────────────────────────────────
  if (!vscode.workspace.isTrusted) {
    securityManager.showUntrustedWorkspaceWarning();
  }
  context.subscriptions.push(
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      void bootstrap();
    })
  );

  // ── Initial load ──────────────────────────────────────────────────────────
  let config: CmdRunnerConfig;
  let workspaceFolder = '';

  async function bootstrap(): Promise<void> {
    if (!vscode.workspace.isTrusted) {
      return;
    }
    try {
      config = configLoader.load();
      workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
      statusBarManager.update(config, workspaceFolder);
      await startupRunner.runStartup(config, workspaceFolder);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      void vscode.window.showErrorMessage(msg);
    }
  }

  // Initialise with a default config so subsequent code can safely dereference.
  config = configLoader.load();
  workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';

  await bootstrap();

  // ── Task provider ─────────────────────────────────────────────────────────
  const taskProvider = new CmdRunnerTaskProvider(config, terminalRunner, workspaceFolder);
  context.subscriptions.push(vscode.tasks.registerTaskProvider('cmdrunner', taskProvider));

  // ── Hot-reload ────────────────────────────────────────────────────────────
  context.subscriptions.push(
    configLoader.onConfigChanged((newConfig) => {
      config = newConfig;
      taskProvider.updateConfig(newConfig);
      statusBarManager.update(newConfig, workspaceFolder);
    })
  );

  // ── Walkthrough ───────────────────────────────────────────────────────────
  await walkthrough.checkAndShowWalkthrough();

  // ── Command: cmdrunner.initialize ─────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('cmdrunner.initialize', async () => {
      if (!workspaceFolder) {
        void vscode.window.showErrorMessage('CmdRunner: No workspace folder is open.');
        return;
      }
      const dest = path.join(workspaceFolder, '.cmdrunner');
      if (fs.existsSync(dest)) {
        void vscode.window.showInformationMessage('CmdRunner: .cmdrunner already exists.');
        return;
      }
      fs.writeFileSync(dest, INIT_TEMPLATE, 'utf8');
      const doc = await vscode.workspace.openTextDocument(dest);
      await vscode.window.showTextDocument(doc);
      void vscode.window.showInformationMessage('CmdRunner: .cmdrunner created!');
    })
  );

  // ── Command: cmdrunner.validateConfig ─────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('cmdrunner.validateConfig', () => {
      try {
        configLoader.load();
        void vscode.window.showInformationMessage('CmdRunner: Configuration is valid ✓');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        void vscode.window.showErrorMessage(msg);
      }
    })
  );

  // ── Command: cmdrunner.switchProfile ─────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('cmdrunner.switchProfile', async () => {
      const names = profileManager.getProfileNames(config);
      if (names.length === 0) {
        void vscode.window.showInformationMessage('CmdRunner: No profiles defined.');
        return;
      }
      const picked = await vscode.window.showQuickPick(names, {
        placeHolder: 'Select a profile',
      });
      if (!picked) {
        return;
      }
      config = profileManager.switchProfile(config, picked);
      taskProvider.updateConfig(config);
      statusBarManager.update(config, workspaceFolder);
      void vscode.window.showInformationMessage(`CmdRunner: Switched to profile "${picked}".`);
    })
  );

  // ── Command: cmdrunner.history ────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('cmdrunner.history', async () => {
      if (history.length === 0) {
        void vscode.window.showInformationMessage('CmdRunner: No commands have been run yet.');
        return;
      }
      const items = history
        .map((id) => config.commands.find((c) => c.id === id))
        .filter((c): c is CommandConfig => c !== undefined)
        .map((c) => ({ label: c.label, description: c.command, id: c.id }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a recent command',
      });
      if (!picked) {
        return;
      }
      const cmd = config.commands.find((c) => c.id === picked.id);
      if (cmd) {
        await runCommandById(
          cmd,
          config,
          workspaceFolder,
          securityManager,
          auditLog,
          terminalRunner
        );
      }
    })
  );

  // ── Command: cmdrunner.runCommand ─────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cmdrunner.runCommand',
      async (commandIdOrConfig: string | CommandConfig, _cfg?: CmdRunnerConfig, _wf?: string) => {
        let cmd: CommandConfig | undefined;
        if (typeof commandIdOrConfig === 'string') {
          cmd = config.commands.find((c) => c.id === commandIdOrConfig);
        } else {
          cmd = commandIdOrConfig;
        }
        if (!cmd) {
          void vscode.window.showErrorMessage(`CmdRunner: Command not found.`);
          return;
        }
        await runCommandById(
          cmd,
          config,
          workspaceFolder,
          securityManager,
          auditLog,
          terminalRunner
        );
      }
    )
  );

  // ── Command: cmdrunner.killCommand ────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('cmdrunner.killCommand', (commandId: string) => {
      terminalRunner.killCommand(commandId);
    })
  );

  // ── Command: cmdrunner.showOverflow ──────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cmdrunner.showOverflow',
      async (commands: CommandConfig[], cfg: CmdRunnerConfig, wf: string) => {
        await statusBarManager.showOverflowPicker(commands, cfg, wf);
      }
    )
  );
}

/**
 * Executes a single command with trust, security, and audit checks.
 *
 * @param cmd The command configuration.
 * @param config Current global config.
 * @param workspaceFolder Workspace root path.
 * @param security Security manager for trust / pattern checks.
 * @param auditLog Audit log instance.
 * @param runner Terminal runner.
 */
async function runCommandById(
  cmd: CommandConfig,
  config: CmdRunnerConfig,
  workspaceFolder: string,
  security: SecurityManager,
  auditLog: AuditLog,
  runner: TerminalRunner
): Promise<void> {
  try {
    security.checkWorkspaceTrust();
    security.checkBlockedPatterns(cmd.command);

    if (cmd.checksum) {
      const ok = security.verifyChecksum(cmd.command, cmd.checksum);
      if (!ok) {
        void vscode.window.showErrorMessage(
          `CmdRunner: checksum mismatch for command "${cmd.id}". Execution blocked.`
        );
        return;
      }
    }

    // If the command is already running, kill it instead.
    if (runner.isRunning(cmd.id)) {
      runner.killCommand(cmd.id);
      return;
    }

    recordHistory(cmd.id);
    auditLog.logExecution(workspaceFolder, cmd.id);
    await runner.runCommand(cmd, config, workspaceFolder);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    void vscode.window.showErrorMessage(msg);
  }
}

/** Called when the extension is deactivated. */
export function deactivate(): void {
  // Resources are cleaned up via context.subscriptions.
}
