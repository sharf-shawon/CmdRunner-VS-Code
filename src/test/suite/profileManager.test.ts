import * as assert from 'assert';
import { ProfileManager } from '../../profileManager';
import { CmdRunnerConfigSchema } from '../../types';

suite('ProfileManager', () => {
  let mgr: ProfileManager;

  const configWithProfiles = CmdRunnerConfigSchema.parse({
    profiles: {
      dev: { env: { NODE_ENV: 'development', PORT: '3000' } },
      prod: { env: { NODE_ENV: 'production', PORT: '8080' } },
    },
    activeProfile: 'dev',
    commands: [],
  });

  setup(() => {
    mgr = new ProfileManager();
  });

  test('getActiveProfile returns the correct profile', () => {
    const profile = mgr.getActiveProfile(configWithProfiles);
    assert.strictEqual(profile?.env?.NODE_ENV, 'development');
    assert.strictEqual(profile?.env?.PORT, '3000');
  });

  test('getActiveProfile returns undefined when no activeProfile is set', () => {
    const config = CmdRunnerConfigSchema.parse({ commands: [] });
    const profile = mgr.getActiveProfile(config);
    assert.strictEqual(profile, undefined);
  });

  test('getActiveProfile returns undefined for unknown profile name', () => {
    const config = CmdRunnerConfigSchema.parse({
      profiles: { dev: { env: {} } },
      activeProfile: 'staging',
      commands: [],
    });
    assert.strictEqual(mgr.getActiveProfile(config), undefined);
  });

  test('mergeEnv merges profile env with command env', () => {
    const env = mgr.mergeEnv(configWithProfiles, { DEBUG: 'true' });
    assert.strictEqual(env.NODE_ENV, 'development');
    assert.strictEqual(env.PORT, '3000');
    assert.strictEqual(env.DEBUG, 'true');
  });

  test('mergeEnv command env overrides profile env', () => {
    const env = mgr.mergeEnv(configWithProfiles, { PORT: '9000' });
    assert.strictEqual(env.PORT, '9000');
  });

  test('mergeEnv returns empty object when no profile and no command env', () => {
    const config = CmdRunnerConfigSchema.parse({ commands: [] });
    const env = mgr.mergeEnv(config);
    assert.deepStrictEqual(env, {});
  });

  test('getProfileNames returns all profile names', () => {
    const names = mgr.getProfileNames(configWithProfiles);
    assert.deepStrictEqual(names.sort(), ['dev', 'prod']);
  });

  test('getProfileNames returns empty array when no profiles defined', () => {
    const config = CmdRunnerConfigSchema.parse({ commands: [] });
    assert.deepStrictEqual(mgr.getProfileNames(config), []);
  });

  test('switchProfile updates activeProfile', () => {
    const updated = mgr.switchProfile(configWithProfiles, 'prod');
    assert.strictEqual(updated.activeProfile, 'prod');
    assert.strictEqual(mgr.getActiveProfile(updated)?.env?.NODE_ENV, 'production');
  });

  test('switchProfile does not mutate the original config', () => {
    mgr.switchProfile(configWithProfiles, 'prod');
    assert.strictEqual(configWithProfiles.activeProfile, 'dev');
  });

  test('switchProfile throws for unknown profile name', () => {
    assert.throws(
      () => mgr.switchProfile(configWithProfiles, 'staging'),
      /not found/,
    );
  });
});
