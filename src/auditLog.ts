import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/** Directory where the audit log is stored. */
const AUDIT_DIR = path.join(os.homedir(), '.cmdrunner');
/** Full path to the audit log file. */
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit.log');

/**
 * Appends structured audit records to `~/.cmdrunner/audit.log`.
 *
 * Each record is a single line:
 * ```
 * <ISO timestamp>\t<workspacePath>\t<commandId>\t<exitCode|->
 * ```
 */
export class AuditLog {
  private _enabled: boolean;

  /**
   * @param enabled When `false`, all log calls are no-ops.
   *                Matches the `cmdrunner.auditLog` VS Code setting.
   */
  constructor(enabled: boolean) {
    this._enabled = enabled;
  }

  /**
   * Updates whether audit logging is active.
   *
   * @param enabled `true` to enable logging, `false` to disable.
   */
  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  /**
   * Appends one execution record to the audit log.
   *
   * @param workspacePath Absolute path of the current workspace folder.
   * @param commandId The `id` field of the executed command.
   * @param exitCode Optional exit code; omitted (recorded as `-`) when the
   *                 process has not yet finished or the code is unavailable.
   */
  public logExecution(workspacePath: string, commandId: string, exitCode?: number): void {
    if (!this._enabled) {
      return;
    }
    this._ensureDir();
    const timestamp = new Date().toISOString();
    const code = exitCode !== undefined ? String(exitCode) : '-';
    const line = `${timestamp}\t${workspacePath}\t${commandId}\t${code}\n`;
    fs.appendFileSync(AUDIT_FILE, line, 'utf8');
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _ensureDir(): void {
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
  }
}
