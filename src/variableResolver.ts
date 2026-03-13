import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Resolves CmdRunner template variables inside command strings and `cwd` paths.
 *
 * Supported variables:
 * - `${workspaceFolder}` — absolute path of the first workspace folder.
 * - `${workspaceName}` — display name of the workspace.
 * - `${gitBranch}` — current Git branch read from `.git/HEAD`.
 * - `${userHome}` — user's home directory (`os.homedir()`).
 * - `${datetime}` — current UTC date-time in ISO 8601 format.
 */
export class VariableResolver {
  private readonly _workspaceRoot: string;

  /**
   * @param workspaceRoot Absolute path to the workspace root (used for Git HEAD resolution).
   */
  constructor(workspaceRoot: string) {
    this._workspaceRoot = workspaceRoot;
  }

  /**
   * Replaces all known `${variable}` tokens in `input`.
   *
   * @param input Raw string that may contain variable tokens.
   * @returns String with all recognised tokens replaced.
   */
  public resolve(input: string): string {
    return input
      .replace(/\$\{workspaceFolder\}/g, this._workspaceFolder())
      .replace(/\$\{workspaceName\}/g, this._workspaceName())
      .replace(/\$\{gitBranch\}/g, this._gitBranch())
      .replace(/\$\{userHome\}/g, os.homedir())
      .replace(/\$\{datetime\}/g, new Date().toISOString());
  }

  // ── Private resolvers ────────────────────────────────────────────────────

  private _workspaceFolder(): string {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : this._workspaceRoot;
  }

  private _workspaceName(): string {
    return vscode.workspace.name ?? path.basename(this._workspaceRoot);
  }

  /**
   * Reads the current branch name from `.git/HEAD`.
   * Returns an empty string when the repository cannot be determined.
   */
  private _gitBranch(): string {
    try {
      const headFile = path.join(this._workspaceRoot, '.git', 'HEAD');
      if (!fs.existsSync(headFile)) {
        return '';
      }
      const content = fs.readFileSync(headFile, 'utf8').trim();
      // Format: "ref: refs/heads/<branch>"
      const match = content.match(/^ref: refs\/heads\/(.+)$/);
      return match ? match[1] : content.slice(0, 7); // detached HEAD — use short SHA
    } catch {
      return '';
    }
  }
}
