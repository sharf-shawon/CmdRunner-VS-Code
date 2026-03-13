import { CmdRunnerConfig, Profile } from './types';

/**
 * Utilities for querying and switching CmdRunner environment profiles.
 */
export class ProfileManager {
  /**
   * Returns the currently active {@link Profile}, or `undefined` when no
   * `activeProfile` is set or the named profile does not exist in the config.
   *
   * @param config Validated CmdRunner configuration.
   */
  public getActiveProfile(config: CmdRunnerConfig): Profile | undefined {
    if (!config.activeProfile) {
      return undefined;
    }
    return config.profiles[config.activeProfile];
  }

  /**
   * Merges environment variables from multiple sources (lowest → highest priority):
   * 1. Active profile `env`.
   * 2. `commandEnv` — per-command overrides.
   *
   * @param config Validated CmdRunner configuration.
   * @param commandEnv Optional per-command environment overrides.
   * @returns Merged environment variable map.
   */
  public mergeEnv(
    config: CmdRunnerConfig,
    commandEnv?: Record<string, string>,
  ): Record<string, string> {
    const profileEnv = this.getActiveProfile(config)?.env ?? {};
    return { ...profileEnv, ...(commandEnv ?? {}) };
  }

  /**
   * Returns a new config object with `activeProfile` set to `profileName`.
   *
   * @param config Validated CmdRunner configuration.
   * @param profileName The key of the profile to activate.
   * @throws {Error} When `profileName` is not found in `config.profiles`.
   */
  public switchProfile(config: CmdRunnerConfig, profileName: string): CmdRunnerConfig {
    if (!(profileName in config.profiles)) {
      throw new Error(`CmdRunner: profile "${profileName}" not found in configuration`);
    }
    return { ...config, activeProfile: profileName };
  }

  /**
   * Returns all profile names defined in the configuration.
   *
   * @param config Validated CmdRunner configuration.
   */
  public getProfileNames(config: CmdRunnerConfig): string[] {
    return Object.keys(config.profiles);
  }
}
