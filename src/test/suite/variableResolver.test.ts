import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { VariableResolver } from '../../variableResolver';

suite('VariableResolver', () => {
  const workspaceRoot = os.tmpdir();
  let resolver: VariableResolver;

  setup(() => {
    resolver = new VariableResolver(workspaceRoot);
  });

  test('resolves ${workspaceFolder}', () => {
    const result = resolver.resolve('cd ${workspaceFolder}');
    assert.ok(
      !result.includes('${workspaceFolder}'),
      '${workspaceFolder} token should be replaced'
    );
    // In the VS Code test host, workspaceFolders[0] is the extension root.
    const expected = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? workspaceRoot;
    assert.ok(result.includes(expected), `resolved path should contain ${expected}`);
  });

  test('resolves ${userHome}', () => {
    const result = resolver.resolve('echo ${userHome}');
    assert.ok(!result.includes('${userHome}'), '${userHome} token should be replaced');
    assert.ok(result.includes(os.homedir()), `result should include homedir: ${os.homedir()}`);
  });

  test('resolves ${datetime} to ISO 8601 format', () => {
    const before = new Date();
    const result = resolver.resolve('log-${datetime}.txt');
    const after = new Date();

    assert.ok(!result.includes('${datetime}'), '${datetime} token should be replaced');
    // Extract the datetime part from "log-<datetime>.txt"
    const match = result.match(/log-(.+)\.txt/);
    assert.ok(match, 'result should match expected format');
    const dt = new Date(match[1]);
    assert.ok(
      dt >= before && dt <= after,
      `resolved datetime ${dt.toISOString()} should be between test bounds`
    );
  });

  test('resolves ${workspaceName}', () => {
    const result = resolver.resolve('ws=${workspaceName}');
    assert.ok(!result.includes('${workspaceName}'), '${workspaceName} token should be replaced');
    const expectedName = vscode.workspace.name ?? path.basename(workspaceRoot);
    assert.ok(
      result.includes(expectedName),
      `result "${result}" should contain workspace name "${expectedName}"`
    );
  });

  test('leaves unknown tokens unchanged', () => {
    const result = resolver.resolve('echo ${unknown}');
    assert.strictEqual(result, 'echo ${unknown}');
  });

  test('resolves multiple tokens in one string', () => {
    const result = resolver.resolve('${userHome}/${workspaceName}');
    assert.ok(!result.includes('${userHome}'));
    assert.ok(!result.includes('${workspaceName}'));
  });

  test('returns unchanged string when no tokens present', () => {
    const input = 'npm run build -- --watch';
    assert.strictEqual(resolver.resolve(input), input);
  });
});
