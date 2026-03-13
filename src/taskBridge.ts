import * as vscode from 'vscode';
import { CmdRunnerConfig, CommandConfig } from './types';
import { TerminalRunner } from './terminalRunner';
import { VariableResolver } from './variableResolver';
import { ProfileManager } from './profileManager';

/** The task type identifier used in `taskDefinitions` in `package.json`. */
const TASK_TYPE = 'cmdrunner';

/** Definition shape for a `cmdrunner` task (matches `package.json` taskDefinitions). */
interface CmdRunnerTaskDefinition extends vscode.TaskDefinition {
  command: string;
  profile?: string;
}

/**
 * Exposes every CmdRunner command as a native VS Code task so users can
 * reference them from `.vscode/tasks.json`, key bindings, or other extensions.
 *
 * Register with:
 * ```ts
 * context.subscriptions.push(
 *   vscode.tasks.registerTaskProvider(TASK_TYPE, new CmdRunnerTaskProvider(...))
 * );
 * ```
 */
export class CmdRunnerTaskProvider implements vscode.TaskProvider {
  private _config: CmdRunnerConfig;
  private readonly _terminalRunner: TerminalRunner;
  private readonly _workspaceFolder: string;
  private readonly _profileManager = new ProfileManager();

  /**
   * @param config Current validated config.
   * @param terminalRunner Shared terminal runner instance.
   * @param workspaceFolder Absolute path to the workspace root.
   */
  constructor(
    config: CmdRunnerConfig,
    terminalRunner: TerminalRunner,
    workspaceFolder: string,
  ) {
    this._config = config;
    this._terminalRunner = terminalRunner;
    this._workspaceFolder = workspaceFolder;
  }

  /**
   * Updates the provider with a fresh config after a hot-reload.
   *
   * @param config Newly loaded config.
   */
  public updateConfig(config: CmdRunnerConfig): void {
    this._config = config;
  }

  /**
   * Called by VS Code to retrieve the list of all available tasks for this provider.
   *
   * @returns Array of {@link vscode.Task} objects, one per command.
   */
  public provideTasks(): vscode.Task[] {
    return this._config.commands.map((cmd) =>
      this._buildTask(cmd, this._config),
    );
  }

  /**
   * Called by VS Code when it needs to resolve a task that was only partially
   * defined (e.g., loaded from `tasks.json`).
   *
   * @param task The partially-defined task to resolve.
   * @returns The fully resolved task, or `undefined` when the command is unknown.
   */
  public resolveTask(task: vscode.Task): vscode.Task | undefined {
    const definition = task.definition as CmdRunnerTaskDefinition;
    const cmd = this._config.commands.find((c) => c.id === definition.command);
    if (!cmd) {
      return undefined;
    }

    // Apply profile override when requested.
    let config = this._config;
    if (definition.profile) {
      try {
        config = this._profileManager.switchProfile(config, definition.profile);
      } catch {
        // Unknown profile — fall back to default.
      }
    }

    return this._buildTask(cmd, config);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _buildTask(cmd: CommandConfig, config: CmdRunnerConfig): vscode.Task {
    const definition: CmdRunnerTaskDefinition = {
      type: TASK_TYPE,
      command: cmd.id,
    };

    const resolver = new VariableResolver(this._workspaceFolder);
    const resolvedCommand = resolver.resolve(cmd.command);

    const execution = new vscode.CustomExecution(async () => {
      await this._terminalRunner.runCommand(cmd, config, this._workspaceFolder);
      return new CmdRunnerPseudoterminal(resolvedCommand);
    });

    const task = new vscode.Task(
      definition,
      vscode.TaskScope.Workspace,
      cmd.label,
      TASK_TYPE,
      execution,
    );

    task.group = resolveTaskGroup(cmd.group);
    return task;
  }
}

/**
 * Maps a free-form group name to one of VS Code's predefined {@link vscode.TaskGroup}
 * constants.  Returns `undefined` for unrecognised names.
 */
function resolveTaskGroup(group: string | undefined): vscode.TaskGroup | undefined {
  if (!group) {
    return undefined;
  }
  switch (group.toLowerCase()) {
    case 'build':
      return vscode.TaskGroup.Build;
    case 'clean':
      return vscode.TaskGroup.Clean;
    case 'rebuild':
      return vscode.TaskGroup.Rebuild;
    case 'test':
      return vscode.TaskGroup.Test;
    default:
      return undefined;
  }
}

/**
 * Minimal {@link vscode.Pseudoterminal} that satisfies the `CustomExecution`
 * contract.  The actual command is executed via `TerminalRunner.runCommand()`;
 * this terminal is immediately closed.
 */
class CmdRunnerPseudoterminal implements vscode.Pseudoterminal {
  private readonly _writeEmitter = new vscode.EventEmitter<string>();
  private readonly _closeEmitter = new vscode.EventEmitter<number | void>();

  public readonly onDidWrite = this._writeEmitter.event;
  public readonly onDidClose = this._closeEmitter.event;

  constructor(private readonly _command: string) {}

  public open(): void {
    this._writeEmitter.fire(`Running: ${this._command}\r\n`);
    this._closeEmitter.fire(0);
  }

  public close(): void {
    this._writeEmitter.dispose();
    this._closeEmitter.dispose();
  }
}
