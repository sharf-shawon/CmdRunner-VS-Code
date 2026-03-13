import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CmdRunnerConfig, CmdRunnerConfigSchema } from './types';

/** Names of the supported config files, in priority order. */
const CONFIG_FILES = ['.cmdrunner', '.cmdrunner.yml'];
/** Names of the user-local override files, in priority order. */
const LOCAL_CONFIG_FILES = ['.cmdrunner.local', '.cmdrunner.local.yml'];

/**
 * Parses a config file (JSON or YAML) and returns a plain object.
 * @param filePath Absolute path to the config file.
 * @returns Parsed object, or `null` if the file does not exist.
 */
function parseFile(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
    return yaml.load(content);
  }
  return JSON.parse(content);
}

/**
 * Deep-merges `override` into `base`.  Arrays in `override` **replace** arrays
 * in `base` (they are not concatenated).
 */
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const bVal = base[key];
    const oVal = override[key];
    if (
      oVal !== null &&
      typeof oVal === 'object' &&
      !Array.isArray(oVal) &&
      bVal !== null &&
      typeof bVal === 'object' &&
      !Array.isArray(bVal)
    ) {
      result[key] = deepMerge(bVal as Record<string, unknown>, oVal as Record<string, unknown>);
    } else {
      result[key] = oVal;
    }
  }
  return result;
}

/**
 * Loads and validates the CmdRunner configuration for a given workspace root.
 *
 * Resolution order:
 * 1. `.cmdrunner` (JSON) or `.cmdrunner.yml` (YAML) — primary config.
 * 2. `.cmdrunner.local` / `.cmdrunner.local.yml` — user-local overrides, deep-merged.
 *
 * @param workspaceRoot Absolute path to the workspace folder.
 * @returns Validated {@link CmdRunnerConfig}, or a default config if no file exists.
 */
function loadConfig(workspaceRoot: string): CmdRunnerConfig {
  let raw: Record<string, unknown> = {};

  // Load primary config file.
  for (const name of CONFIG_FILES) {
    const parsed = parseFile(path.join(workspaceRoot, name));
    if (parsed !== null) {
      raw = parsed as Record<string, unknown>;
      break;
    }
  }

  // Apply user-local overrides.
  for (const name of LOCAL_CONFIG_FILES) {
    const parsed = parseFile(path.join(workspaceRoot, name));
    if (parsed !== null) {
      raw = deepMerge(raw, parsed as Record<string, unknown>);
      break;
    }
  }

  const result = CmdRunnerConfigSchema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`CmdRunner: invalid configuration:\n${msg}`);
  }
  return result.data;
}

/**
 * Manages loading, caching, and hot-reloading of the CmdRunner config.
 *
 * Subscribe to {@link ConfigLoader.onConfigChanged} to receive reload events.
 */
export class ConfigLoader {
  private _config: CmdRunnerConfig | undefined;
  private readonly _watchers: fs.FSWatcher[] = [];
  private readonly _onConfigChanged = new vscode.EventEmitter<CmdRunnerConfig>();
  private _workspaceRoot: string | undefined;

  /** Fires whenever the config file changes on disk and is successfully reloaded. */
  public readonly onConfigChanged = this._onConfigChanged.event;

  /**
   * Loads the config from disk and starts watching for changes.
   * Safe to call multiple times; previously registered watchers are disposed first.
   *
   * @returns The validated {@link CmdRunnerConfig}.
   */
  public load(): CmdRunnerConfig {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      this._config = CmdRunnerConfigSchema.parse({});
      return this._config;
    }

    this._workspaceRoot = folders[0].uri.fsPath;
    this._config = loadConfig(this._workspaceRoot);
    this._startWatching();
    return this._config;
  }

  /**
   * Returns the most-recently loaded config.
   * Throws if {@link load} has not been called yet.
   */
  public getConfig(): CmdRunnerConfig {
    if (!this._config) {
      throw new Error('CmdRunner: config not loaded — call load() first');
    }
    return this._config;
  }

  /** Stops all file-system watchers and disposes the event emitter. */
  public dispose(): void {
    this._stopWatching();
    this._onConfigChanged.dispose();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _startWatching(): void {
    this._stopWatching();
    if (!this._workspaceRoot) {
      return;
    }
    const watchFiles = [...CONFIG_FILES, ...LOCAL_CONFIG_FILES];
    for (const name of watchFiles) {
      const filePath = path.join(this._workspaceRoot, name);
      if (!fs.existsSync(filePath)) {
        continue;
      }
      try {
        const watcher = fs.watch(filePath, () => this._reload());
        this._watchers.push(watcher);
      } catch {
        // File may not be watchable; silently skip.
      }
    }
  }

  private _stopWatching(): void {
    for (const w of this._watchers) {
      try {
        w.close();
      } catch {
        // Ignore errors when closing watchers.
      }
    }
    this._watchers.length = 0;
  }

  private _reload(): void {
    if (!this._workspaceRoot) {
      return;
    }
    try {
      this._config = loadConfig(this._workspaceRoot);
      this._onConfigChanged.fire(this._config);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(msg);
    }
  }
}
