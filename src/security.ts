import * as vscode from 'vscode';
import * as crypto from 'crypto';

/** Patterns that are always masked regardless of settings. */
const BUILTIN_MASK_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{20,}/g, // OpenAI-style secret keys
  /ghp_[A-Za-z0-9]{36,}/g, // GitHub personal access tokens
  /[A-Za-z0-9]{40,}/g, // Generic long alphanumeric secrets
];

/**
 * Handles workspace-trust enforcement, command allow/block checks, checksum
 * verification, and secret masking for CmdRunner.
 */
export class SecurityManager {
  /**
   * Checks whether the current workspace is trusted.
   * Throws an {@link Error} (and shows an error notification) when it is not.
   */
  public checkWorkspaceTrust(): void {
    if (!vscode.workspace.isTrusted) {
      const msg =
        'CmdRunner: This workspace is not trusted. Commands will not run until you trust the workspace.';
      void vscode.window.showErrorMessage(msg);
      throw new Error(msg);
    }
  }

  /**
   * Shows a warning message when the workspace is not trusted.
   * Unlike {@link checkWorkspaceTrust} this does **not** throw.
   */
  public showUntrustedWorkspaceWarning(): void {
    if (!vscode.workspace.isTrusted) {
      void vscode.window
        .showWarningMessage(
          'CmdRunner is running in an untrusted workspace. ' +
            'Command execution is disabled until the workspace is trusted.',
          'Trust Workspace'
        )
        .then((choice) => {
          if (choice === 'Trust Workspace') {
            void vscode.commands.executeCommand('workbench.trust.manage');
          }
        });
    }
  }

  /**
   * Checks whether `command` matches any blocked pattern configured by the user.
   *
   * @param command The raw command string to test.
   * @throws {Error} When the command matches a blocked pattern.
   */
  public checkBlockedPatterns(command: string): void {
    const config = vscode.workspace.getConfiguration('cmdrunner');
    const blocked: string[] = config.get<string[]>('blockedPatterns') ?? [];

    for (const pattern of blocked) {
      try {
        const re = new RegExp(pattern);
        if (re.test(command)) {
          const msg = `CmdRunner: command blocked by pattern "${pattern}": ${command}`;
          void vscode.window.showErrorMessage(msg);
          throw new Error(msg);
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          // Invalid regex — skip and continue.
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Verifies a SHA-256 checksum against the given command string.
   *
   * @param command The command string to verify.
   * @param checksum Expected hex-encoded SHA-256 digest.
   * @returns `true` if the checksum matches, `false` otherwise.
   */
  public verifyChecksum(command: string, checksum: string): boolean {
    const digest = crypto.createHash('sha256').update(command, 'utf8').digest('hex');
    return digest === checksum.toLowerCase();
  }

  /**
   * Masks sensitive-looking tokens in `text` so they are safe to display
   * in notifications, logs, or tooltips.
   *
   * @param text Arbitrary text that may contain secrets.
   * @returns The same text with secret-looking substrings replaced by `***`.
   */
  public maskSecrets(text: string): string {
    let result = text;
    for (const pattern of BUILTIN_MASK_PATTERNS) {
      result = result.replace(pattern, '***');
    }
    return result;
  }
}
