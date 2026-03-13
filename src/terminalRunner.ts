import * as vscode from 'vscode';
import { CommandConfig, CmdRunnerConfig } from './types';
import { ProfileManager } from './profileManager';
import { VariableResolver } from './variableResolver';

/** Tracks the state of a single running command. */
interface RunningCommand {
  terminal: vscode.Terminal;
  startedAt: number;
}

/** Events emitted by the terminal runner. */
export type CommandStatus = 'starting' | 'running' | 'stopped';

/**
 * Manages VS Code integrated terminals and dispatches commands via
 * `terminal.sendText()`.  Never uses `child_process`.
 */
export class TerminalRunner {
  private readonly _running = new Map<string, RunningCommand>();
  private readonly _terminals = new Map<string, vscode.Terminal>();
  private readonly _profileManager = new ProfileManager();
  private readonly _onStatusChange = new vscode.EventEmitter<{
    commandId: string;
    status: CommandStatus;
  }>();

  /** Fires whenever a command's status changes. */
  public readonly onStatusChange = this._onStatusChange.event;

  /**
   * Runs a command in a (possibly reused) integrated terminal.
   *
   * Execution order:
   * 1. Resolve any `dependsOn` commands first (serially).
   * 2. Resolve variables in `command` and `cwd`.
   * 3. Obtain or create a terminal.
   * 4. Set environment variables via shell-compatible exports.
   * 5. `cd` to the resolved `cwd` when provided.
   * 6. Send the command text.
   *
   * @param command The {@link CommandConfig} to execute.
   * @param config The current {@link CmdRunnerConfig}.
   * @param workspaceFolder Absolute path to the workspace root.
   */
  public async runCommand(
    command: CommandConfig,
    config: CmdRunnerConfig,
    workspaceFolder: string,
  ): Promise<void> {
    // Resolve dependencies first.
    for (const depId of command.dependsOn) {
      const dep = config.commands.find((c) => c.id === depId);
      if (dep) {
        await this.runCommand(dep, config, workspaceFolder);
        // Small pause between dependent commands.
        await delay(config.cooldownMs);
      }
    }

    const resolver = new VariableResolver(workspaceFolder);
    const mergedEnv = this._profileManager.mergeEnv(config, command.env);
    const resolvedCommand = resolver.resolve(command.command);
    const resolvedCwd = command.cwd ? resolver.resolve(command.cwd) : undefined;
    const terminalName = command.terminal ?? command.label;

    const terminal = this.getOrCreateTerminal(
      terminalName,
      command.terminalProfile ?? config.terminalProfile,
      command.reuseTerminal,
    );
    terminal.show(true);

    this._running.set(command.id, { terminal, startedAt: Date.now() });
    this._onStatusChange.fire({ commandId: command.id, status: 'running' });

    // Export env vars.
    for (const [key, value] of Object.entries(mergedEnv)) {
      terminal.sendText(`export ${key}=${shellQuote(value)}`);
    }

    // Change directory when specified.
    if (resolvedCwd) {
      terminal.sendText(`cd ${shellQuote(resolvedCwd)}`);
    }

    terminal.sendText(resolvedCommand);
  }

  /**
   * Sends Ctrl+C to the terminal associated with `commandId`, effectively
   * interrupting whatever is currently running there.
   *
   * @param commandId The `id` of the command to stop.
   */
  public killCommand(commandId: string): void {
    const entry = this._running.get(commandId);
    if (!entry) {
      return;
    }
    entry.terminal.sendText('\x03'); // ETX — Ctrl+C
    this._running.delete(commandId);
    this._onStatusChange.fire({ commandId, status: 'stopped' });
  }

  /**
   * Returns an existing terminal with `name`, or creates a new one.
   *
   * @param name Terminal tab name.
   * @param terminalProfile Optional VS Code terminal profile to use for new terminals.
   * @param reuse When `false`, always creates a fresh terminal (default: `true`).
   */
  public getOrCreateTerminal(
    name: string,
    terminalProfile?: string,
    reuse = true,
  ): vscode.Terminal {
    if (reuse) {
      // Check if existing terminal is still alive.
      const cached = this._terminals.get(name);
      if (cached && isTerminalAlive(cached)) {
        return cached;
      }
    }

    const options: vscode.TerminalOptions = { name };
    if (terminalProfile && terminalProfile !== 'default') {
      // Pass profile as a named option if supported.
      (options as vscode.TerminalOptions & { shellPath?: string }).shellPath = undefined;
    }

    const terminal = vscode.window.createTerminal(options);
    this._terminals.set(name, terminal);
    return terminal;
  }

  /**
   * Returns `true` if the command with `commandId` is currently tracked as running.
   *
   * @param commandId The `id` of the command to check.
   */
  public isRunning(commandId: string): boolean {
    return this._running.has(commandId);
  }

  /** Disposes all resources (event emitter, tracked terminals). */
  public dispose(): void {
    this._onStatusChange.dispose();
    this._running.clear();
    this._terminals.clear();
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wraps `value` in single quotes, escaping any existing single quotes.
 * Suitable for POSIX-compatible shells.
 */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

/** Resolves after `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Heuristic check whether a terminal is still open by comparing it against
 * the list of currently registered terminals.
 */
function isTerminalAlive(terminal: vscode.Terminal): boolean {
  return vscode.window.terminals.includes(terminal);
}
