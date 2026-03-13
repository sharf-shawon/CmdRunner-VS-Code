import * as assert from 'assert';
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { SecurityManager } from '../../security';

suite('SecurityManager', () => {
  let mgr: SecurityManager;

  setup(() => {
    mgr = new SecurityManager();
  });

  test('maskSecrets masks sk-... patterns', () => {
    const result = mgr.maskSecrets('key=sk-abc123ABC456def789GHI012jkl345MNO');
    assert.ok(!result.includes('sk-'), 'sk- prefix should be masked');
    assert.ok(result.includes('***'), 'masked value should contain ***');
  });

  test('maskSecrets masks ghp_... patterns', () => {
    const token = 'ghp_' + 'a'.repeat(36);
    const result = mgr.maskSecrets(`Authorization: Bearer ${token}`);
    assert.ok(!result.includes('ghp_'), 'ghp_ prefix should be masked');
    assert.ok(result.includes('***'), 'masked value should contain ***');
  });

  test('maskSecrets masks 40+ char alphanumeric strings', () => {
    const secret = 'Aa1'.repeat(14); // 42 chars
    const result = mgr.maskSecrets(secret);
    assert.strictEqual(result, '***');
  });

  test('maskSecrets leaves short strings alone', () => {
    const result = mgr.maskSecrets('hello world');
    assert.strictEqual(result, 'hello world');
  });

  test('maskSecrets handles empty string', () => {
    assert.strictEqual(mgr.maskSecrets(''), '');
  });

  test('verifyChecksum returns true for correct hash', async () => {
    const cmd = 'npm run build';
    const hash = crypto.createHash('sha256').update(cmd, 'utf8').digest('hex');
    const ok = await mgr.verifyChecksum(cmd, hash);
    assert.strictEqual(ok, true);
  });

  test('verifyChecksum returns false for wrong hash', async () => {
    const ok = await mgr.verifyChecksum('npm run build', 'deadbeef');
    assert.strictEqual(ok, false);
  });

  test('verifyChecksum is case-insensitive for the expected hash', async () => {
    const cmd = 'echo hello';
    const hash = crypto.createHash('sha256').update(cmd, 'utf8').digest('hex');
    const ok = await mgr.verifyChecksum(cmd, hash.toUpperCase());
    assert.strictEqual(ok, true);
  });

  test('checkBlockedPatterns allows commands when blockedPatterns is empty', () => {
    // Default config has blockedPatterns: [], so nothing should be blocked.
    assert.doesNotThrow(() => mgr.checkBlockedPatterns('npm run build'));
    assert.doesNotThrow(() => mgr.checkBlockedPatterns('echo hello'));
  });

  test('checkBlockedPatterns blocks a command matching a configured pattern', async () => {
    await vscode.workspace
      .getConfiguration('cmdrunner')
      .update('blockedPatterns', ['rm\\s+-rf'], vscode.ConfigurationTarget.Global);
    try {
      assert.throws(
        () => mgr.checkBlockedPatterns('rm -rf /tmp/test'),
        /blocked by pattern/,
      );
    } finally {
      await vscode.workspace
        .getConfiguration('cmdrunner')
        .update('blockedPatterns', [], vscode.ConfigurationTarget.Global);
    }
  });

  test('checkBlockedPatterns allows commands that do not match the pattern', async () => {
    await vscode.workspace
      .getConfiguration('cmdrunner')
      .update('blockedPatterns', ['rm\\s+-rf'], vscode.ConfigurationTarget.Global);
    try {
      assert.doesNotThrow(() => mgr.checkBlockedPatterns('npm install'));
    } finally {
      await vscode.workspace
        .getConfiguration('cmdrunner')
        .update('blockedPatterns', [], vscode.ConfigurationTarget.Global);
    }
  });
});
