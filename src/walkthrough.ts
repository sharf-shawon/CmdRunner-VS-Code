import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/** ID of the walkthrough contributed in `package.json`. */
const WALKTHROUGH_ID = 'cmdrunner.cmdrunner.onboarding';

/**
 * Manages the CmdRunner onboarding walkthrough.
 *
 * On first activation (no `.cmdrunner` file found in the workspace), the
 * built-in VS Code walkthrough panel is opened automatically.
 */
export class WalkthroughManager {
  /**
   * Checks whether a `.cmdrunner` (JSON) or `.cmdrunner.yml` file exists in
   * the workspace root.  When neither is found the onboarding walkthrough is
   * surfaced to the user.
   */
  public async checkAndShowWalkthrough(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return;
    }

    const root = folders[0].uri.fsPath;
    if (this._configExists(root)) {
      return;
    }

    await vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      WALKTHROUGH_ID,
      false, // don't force-focus the walkthrough panel
    );
  }

  /**
   * Returns `true` when any recognised config file exists in `workspaceRoot`.
   *
   * @param workspaceRoot Absolute path to the workspace folder.
   */
  private _configExists(workspaceRoot: string): boolean {
    const candidates = ['.cmdrunner', '.cmdrunner.yml', '.cmdrunner.local', '.cmdrunner.local.yml'];
    return candidates.some((name) => fs.existsSync(path.join(workspaceRoot, name)));
  }
}
