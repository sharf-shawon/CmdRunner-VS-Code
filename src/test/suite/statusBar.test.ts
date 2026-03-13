import * as assert from 'assert';
import * as vscode from 'vscode';
import { StatusBarManager } from '../../statusBar';
import { TerminalRunner } from '../../terminalRunner';
import { CmdRunnerConfigSchema } from '../../types';

/** Typed helpers for accessing private StatusBarManager/TerminalRunner internals in tests. */
type MgrInternals = {
  _items: Map<string, vscode.StatusBarItem>;
  _overflowItem: vscode.StatusBarItem | undefined;
};
type RunnerInternals = {
  _onStatusChange: vscode.EventEmitter<{ commandId: string; status: string }>;
};
const mgrPriv = (m: StatusBarManager): MgrInternals =>
  m as unknown as MgrInternals;
const runnerPriv = (r: TerminalRunner): RunnerInternals =>
  r as unknown as RunnerInternals;

suite('StatusBarManager', () => {
  let runner: TerminalRunner;
  let mgr: StatusBarManager;

  const config = CmdRunnerConfigSchema.parse({
    commands: [
      { id: 'build', label: 'Build', command: 'npm run build' },
      { id: 'test-cmd', label: 'Test', command: 'npm test' },
    ],
  });

  setup(() => {
    runner = new TerminalRunner();
    mgr = new StatusBarManager(runner);
  });

  teardown(() => {
    mgr.dispose();
  });

  test('status bar items are created for each command', () => {
    mgr.update(config, '/tmp/workspace');
    const items = mgrPriv(mgr)._items;
    assert.strictEqual(items.size, 2);
    assert.ok(items.has('build'));
    assert.ok(items.has('test-cmd'));
  });

  test('items show the play icon and label initially', () => {
    mgr.update(config, '/tmp/workspace');
    const buildItem = mgrPriv(mgr)._items.get('build')!;
    assert.ok(buildItem.text.includes('$(play)'), `expected $(play) in: ${buildItem.text}`);
    assert.ok(buildItem.text.includes('Build'));
  });

  test('spinner shown when command is running', () => {
    mgr.update(config, '/tmp/workspace');
    runnerPriv(runner)._onStatusChange.fire({ commandId: 'build', status: 'running' });
    const item = mgrPriv(mgr)._items.get('build')!;
    assert.ok(
      item.text.includes('$(sync~spin)'),
      `expected spinner in: ${item.text}`,
    );
  });

  test('stop command set on re-click when command is running', () => {
    mgr.update(config, '/tmp/workspace');
    runnerPriv(runner)._onStatusChange.fire({ commandId: 'build', status: 'running' });
    const item = mgrPriv(mgr)._items.get('build')!;
    const cmd = item.command as vscode.Command;
    assert.strictEqual(cmd.command, 'cmdrunner.killCommand');
  });

  test('play icon restored after command stops', () => {
    mgr.update(config, '/tmp/workspace');
    runnerPriv(runner)._onStatusChange.fire({ commandId: 'build', status: 'running' });
    runnerPriv(runner)._onStatusChange.fire({ commandId: 'build', status: 'stopped' });
    const item = mgrPriv(mgr)._items.get('build')!;
    assert.ok(item.text.includes('$(play)'), `expected $(play) restored in: ${item.text}`);
  });

  test('overflow item created when commands exceed maxVisible', () => {
    const bigConfig = CmdRunnerConfigSchema.parse({
      maxVisible: 1,
      commands: [
        { id: 'c1', label: 'Cmd1', command: 'echo 1' },
        { id: 'c2', label: 'Cmd2', command: 'echo 2' },
      ],
    });
    mgr.update(bigConfig, '/tmp/workspace');
    assert.strictEqual(mgrPriv(mgr)._items.size, 1, 'only 1 inline item when maxVisible=1');
    assert.ok(mgrPriv(mgr)._overflowItem, 'overflow item should exist');
  });

  test('update rebuilds items on second call', () => {
    mgr.update(config, '/tmp/workspace');
    const firstSize = mgrPriv(mgr)._items.size;
    mgr.update(config, '/tmp/workspace');
    assert.strictEqual(mgrPriv(mgr)._items.size, firstSize);
  });

  test('dispose clears all items without error', () => {
    mgr.update(config, '/tmp/workspace');
    assert.doesNotThrow(() => mgr.dispose());
  });

  test('double dispose is safe', () => {
    mgr.update(config, '/tmp/workspace');
    mgr.dispose();
    assert.doesNotThrow(() => mgr.dispose());
  });
});
