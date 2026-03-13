import * as assert from 'assert';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from '../../configLoader';

suite('ConfigLoader', () => {
  let tmpDir: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmdrunner-test-'));
  });

  teardown(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('loads a valid JSON config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.cmdrunner'),
      JSON.stringify({
        commands: [{ id: 'build', label: 'Build', command: 'npm run build' }],
      }),
    );
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.commands.length, 1);
    assert.strictEqual(config.commands[0].id, 'build');
    assert.strictEqual(config.commands[0].command, 'npm run build');
  });

  test('loads a valid YAML config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.cmdrunner.yml'),
      'commands:\n  - id: test\n    label: Test\n    command: npm test\n',
    );
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.commands[0].id, 'test');
    assert.strictEqual(config.commands[0].label, 'Test');
  });

  test('throws on invalid config (missing required id field)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.cmdrunner'),
      JSON.stringify({ commands: [{ label: 'No ID', command: 'echo hi' }] }),
    );
    assert.throws(() => loadConfig(tmpDir), /CmdRunner: invalid configuration/);
  });

  test('deep-merges local override', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.cmdrunner'),
      JSON.stringify({ maxVisible: 3, cooldownMs: 1000 }),
    );
    fs.writeFileSync(
      path.join(tmpDir, '.cmdrunner.local'),
      JSON.stringify({ cooldownMs: 500 }),
    );
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.maxVisible, 3);
    assert.strictEqual(config.cooldownMs, 500);
  });

  test('returns schema defaults when no config file exists', () => {
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.display, 'auto');
    assert.strictEqual(config.maxVisible, 5);
    assert.deepStrictEqual(config.commands, []);
  });

  test('unknown top-level fields are stripped by schema', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.cmdrunner'),
      JSON.stringify({ commands: [], unknownField: 'ignored' }),
    );
    const config = loadConfig(tmpDir);
    assert.ok(!('unknownField' in config));
  });
});
