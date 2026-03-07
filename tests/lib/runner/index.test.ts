import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  runnerSpawn,
  runnerSend,
  runnerKill,
  runnerList,
  writeTempScript,
  deleteTempScript,
  onRunnerStdout,
  onRunnerStderr,
  onRunnerExit,
} from '@/lib/runner/index';

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

beforeEach(() => vi.resetAllMocks());

// --- runnerSpawn ---

describe('runnerSpawn', () => {
  it('invokes runner_spawn with id, script, args and permissions', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await runnerSpawn({ id: 'r1', script: 'console.log(1)', args: ['--foo'], permissions: { allow_net: 'example.com' } });
    expect(mockInvoke).toHaveBeenCalledWith('runner_spawn', {
      id: 'r1',
      script: 'console.log(1)',
      args: ['--foo'],
      permissions: { allow_net: 'example.com' },
    });
  });

  it('defaults args to [] when not provided', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await runnerSpawn({ id: 'r1', script: 'x' });
    expect(mockInvoke).toHaveBeenCalledWith('runner_spawn', expect.objectContaining({ args: [] }));
  });

  it('defaults permissions to null when not provided', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await runnerSpawn({ id: 'r1', script: 'x' });
    expect(mockInvoke).toHaveBeenCalledWith('runner_spawn', expect.objectContaining({ permissions: null }));
  });
});

// --- runnerSend ---

describe('runnerSend', () => {
  it('invokes runner_send with id and input', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await runnerSend('r1', 'hello');
    expect(mockInvoke).toHaveBeenCalledWith('runner_send', { id: 'r1', input: 'hello' });
  });
});

// --- runnerKill ---

describe('runnerKill', () => {
  it('invokes runner_kill with id', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await runnerKill('r1');
    expect(mockInvoke).toHaveBeenCalledWith('runner_kill', { id: 'r1' });
  });
});

// --- runnerList ---

describe('runnerList', () => {
  it('invokes runner_list and returns the result', async () => {
    mockInvoke.mockResolvedValue(['r1', 'r2']);
    expect(await runnerList()).toEqual(['r1', 'r2']);
    expect(mockInvoke).toHaveBeenCalledWith('runner_list');
  });
});

// --- writeTempScript ---

describe('writeTempScript', () => {
  it('invokes write_temp_script with id and code, returns the path', async () => {
    mockInvoke.mockResolvedValue('/tmp/r1.ts');
    expect(await writeTempScript('r1', 'return 42')).toBe('/tmp/r1.ts');
    expect(mockInvoke).toHaveBeenCalledWith('write_temp_script', { id: 'r1', code: 'return 42' });
  });
});

// --- deleteTempScript ---

describe('deleteTempScript', () => {
  it('invokes delete_temp_script with the path', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await deleteTempScript('/tmp/r1.ts');
    expect(mockInvoke).toHaveBeenCalledWith('delete_temp_script', { path: '/tmp/r1.ts' });
  });
});

// --- event listeners ---

describe('onRunnerStdout', () => {
  it('listens on runner-stdout and passes payload to callback', async () => {
    const unlisten = vi.fn();
    mockListen.mockImplementation(async (_event, handler) => {
      handler({ payload: { id: 'r1', data: 'line\n' } } as never);
      return unlisten;
    });

    const cb = vi.fn();
    const result = await onRunnerStdout(cb);

    expect(mockListen).toHaveBeenCalledWith('runner-stdout', expect.any(Function));
    expect(cb).toHaveBeenCalledWith({ id: 'r1', data: 'line\n' });
    expect(result).toBe(unlisten);
  });
});

describe('onRunnerStderr', () => {
  it('listens on runner-stderr and passes payload to callback', async () => {
    const unlisten = vi.fn();
    mockListen.mockImplementation(async (_event, handler) => {
      handler({ payload: { id: 'r1', data: 'error\n' } } as never);
      return unlisten;
    });

    const cb = vi.fn();
    await onRunnerStderr(cb);

    expect(mockListen).toHaveBeenCalledWith('runner-stderr', expect.any(Function));
    expect(cb).toHaveBeenCalledWith({ id: 'r1', data: 'error\n' });
  });
});

describe('onRunnerExit', () => {
  it('listens on runner-exit and passes payload to callback', async () => {
    const unlisten = vi.fn();
    mockListen.mockImplementation(async (_event, handler) => {
      handler({ payload: { id: 'r1', code: 0 } } as never);
      return unlisten;
    });

    const cb = vi.fn();
    await onRunnerExit(cb);

    expect(mockListen).toHaveBeenCalledWith('runner-exit', expect.any(Function));
    expect(cb).toHaveBeenCalledWith({ id: 'r1', code: 0 });
  });

  it('passes null exit code when process was killed by signal', async () => {
    const unlisten = vi.fn();
    mockListen.mockImplementation(async (_event, handler) => {
      handler({ payload: { id: 'r1', code: null } } as never);
      return unlisten;
    });

    const cb = vi.fn();
    await onRunnerExit(cb);
    expect(cb).toHaveBeenCalledWith({ id: 'r1', code: null });
  });
});
