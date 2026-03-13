import * as vscode from 'vscode';
import { CmdRunnerConfig, CommandConfig } from './types';
import { TerminalRunner } from './terminalRunner';

/** Priority at which CmdRunner items appear in the status bar (left-hand side). */
const STATUS_BAR_PRIORITY = 100;

/** Spinner icon shown while a command is running. */
const ICON_RUNNING = '$(sync~spin)';
/** Default play icon. */
const ICON_PLAY = '$(play)';

/**
 * Manages a collection of VS Code status bar items that represent CmdRunner
 * commands.  Handles:
 * - Creation / disposal of {@link vscode.StatusBarItem} objects.
 * - Spinning/stop icons while commands are running.
 * - Exit-code tooltips on completion.
 * - `maxVisible` cap — surplus commands surface via QuickPick.
 * - Group labels as status-bar separators.
 */
export class StatusBarManager {
  private readonly _items = new Map<string, vscode.StatusBarItem>();
  private _overflowItem: vscode.StatusBarItem | undefined;
  private _config: CmdRunnerConfig | undefined;
  private readonly _terminalRunner: TerminalRunner;
  private _workspaceFolder = '';

  /**
   * @param terminalRunner Shared {@link TerminalRunner} instance used to
   *                       execute commands and track their state.
   */
  constructor(terminalRunner: TerminalRunner) {
    this._terminalRunner = terminalRunner;

    terminalRunner.onStatusChange(({ commandId, status }) => {
      this._updateItemState(commandId, status === 'running');
    });
  }

  /**
   * Rebuilds all status bar items from the provided config.
   * Previously created items are disposed first.
   *
   * @param config Validated {@link CmdRunnerConfig}.
   * @param workspaceFolder Absolute path to the workspace root.
   */
  public update(config: CmdRunnerConfig, workspaceFolder: string): void {
    this._config = config;
    this._workspaceFolder = workspaceFolder;
    this._disposeAll();
    this._build(config);
  }

  /** Disposes all status bar items. */
  public dispose(): void {
    this._disposeAll();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _build(config: CmdRunnerConfig): void {
    const vsConfig = vscode.workspace.getConfiguration('cmdrunner');
    const maxVisible: number = config.maxVisible ?? vsConfig.get<number>('maxVisible') ?? 5;
    const commands = config.commands;

    const visible = commands.slice(0, maxVisible);
    const overflow = commands.slice(maxVisible);

    for (const cmd of visible) {
      this._createItem(cmd, config);
    }

    if (overflow.length > 0) {
      this._createOverflowItem(overflow, config);
    }
  }

  private _createItem(cmd: CommandConfig, config: CmdRunnerConfig): void {
    const item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      STATUS_BAR_PRIORITY
    );

    item.text = `${ICON_PLAY} ${cmd.label}`;
    item.tooltip = cmd.command;
    item.color = cmd.color;
    item.command = {
      command: 'cmdrunner.runCommand',
      title: cmd.label,
      arguments: [cmd.id, config, this._workspaceFolder],
    };
    item.show();
    this._items.set(cmd.id, item);
  }

  private _createOverflowItem(overflow: CommandConfig[], config: CmdRunnerConfig): void {
    const item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      STATUS_BAR_PRIORITY - 1
    );
    item.text = `$(ellipsis) +${overflow.length} more`;
    item.tooltip = 'Show all CmdRunner commands';
    item.command = {
      command: 'cmdrunner.showOverflow',
      title: 'Show overflow commands',
      arguments: [overflow, config, this._workspaceFolder],
    };
    item.show();
    this._overflowItem = item;
  }

  /**
   * Updates the icon and tooltip of a single status bar item based on running state.
   *
   * @param commandId The `id` of the command whose item should be updated.
   * @param running `true` while the command is active.
   * @param exitCode Optional exit code shown in the tooltip when finished.
   */
  private _updateItemState(commandId: string, running: boolean, exitCode?: number): void {
    const item = this._items.get(commandId);
    if (!item || !this._config) {
      return;
    }
    const cmd = this._config.commands.find((c) => c.id === commandId);
    if (!cmd) {
      return;
    }

    if (running) {
      item.text = `${ICON_RUNNING} ${cmd.label}`;
      item.tooltip = `${cmd.command}\n\nClick to stop`;
      item.command = {
        command: 'cmdrunner.killCommand',
        title: `Stop ${cmd.label}`,
        arguments: [commandId],
      };
    } else {
      item.text = `${ICON_PLAY} ${cmd.label}`;
      const tooltip =
        exitCode !== undefined ? `${cmd.command}\n\nExit code: ${exitCode}` : cmd.command;
      item.tooltip = tooltip;
      item.command = {
        command: 'cmdrunner.runCommand',
        title: cmd.label,
        arguments: [commandId, this._config, this._workspaceFolder],
      };
    }
  }

  private _disposeAll(): void {
    for (const item of this._items.values()) {
      item.dispose();
    }
    this._items.clear();
    this._overflowItem?.dispose();
    this._overflowItem = undefined;
  }

  /**
   * Shows a QuickPick listing all commands grouped by their `group` field.
   * Used for the overflow (+N more) action.
   *
   * @param commands Commands to display.
   * @param config Current config (passed through to execution).
   * @param workspaceFolder Workspace root path.
   */
  public async showOverflowPicker(
    commands: CommandConfig[],
    config: CmdRunnerConfig,
    workspaceFolder: string
  ): Promise<void> {
    // Build QuickPick items, inserting group separators.
    type QPI = vscode.QuickPickItem & { cmd?: CommandConfig };
    const items: QPI[] = [];
    const seen = new Set<string>();

    for (const cmd of commands) {
      const group = cmd.group ?? '';
      if (group && !seen.has(group)) {
        items.push({ label: group, kind: vscode.QuickPickItemKind.Separator });
        seen.add(group);
      }
      items.push({
        label: `${ICON_PLAY} ${cmd.label}`,
        description: cmd.command,
        cmd,
      });
    }

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a command to run',
    });
    if (picked?.cmd) {
      await this._terminalRunner.runCommand(picked.cmd, config, workspaceFolder);
    }
  }
}
