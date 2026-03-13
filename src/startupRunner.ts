import * as vscode from 'vscode';
import { CmdRunnerConfig, StartupCommand } from './types';
import { VariableResolver } from './variableResolver';

/**
 * Orchestrates the execution of startup commands defined in the CmdRunner config.
 *
 * Commands can run **sequentially** (one after the other, with the configured
 * `cooldownMs` gap) or **in parallel** (all dispatched at the same time).
 */
export class StartupRunner {
  /**
   * Runs all commands listed in `config.startup`.
   *
   * - `sequential` (default) — commands run one after the other, each in its
   *   own terminal, separated by `config.cooldownMs`.
   * - `parallel` — all commands are sent immediately without waiting.
   *
   * @param config Validated {@link CmdRunnerConfig}.
   * @param workspaceFolder Absolute path to the workspace root.
   */
  public async runStartup(config: CmdRunnerConfig, workspaceFolder: string): Promise<void> {
    if (config.startup.length === 0) {
      return;
    }

    const resolver = new VariableResolver(workspaceFolder);

    if (config.startupMode === 'parallel') {
      await Promise.all(
        config.startup.map((cmd) => this._dispatch(cmd, resolver)),
      );
    } else {
      for (const cmd of config.startup) {
        await this._dispatch(cmd, resolver);
        if (config.cooldownMs > 0) {
          await delay(config.cooldownMs);
        }
      }
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Sends a single startup command to a dedicated terminal.
   *
   * @param cmd The startup command entry.
   * @param resolver Variable resolver for the current workspace.
   */
  private async _dispatch(cmd: StartupCommand, resolver: VariableResolver): Promise<void> {
    const resolved = resolver.resolve(cmd.command);
    const terminal = vscode.window.createTerminal({ name: cmd.label });
    terminal.show(true);
    terminal.sendText(resolved);
  }
}

/** Resolves after `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
