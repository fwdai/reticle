import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RunnerPermissions {
  /** Comma-separated hostnames, or omit to deny all network access. */
  allow_net?: string;
  /** Comma-separated paths, or omit to deny all file reads. */
  allow_read?: string;
  /** Comma-separated paths, or omit to deny all file writes. */
  allow_write?: string;
  /** Set true to expose environment variables. */
  allow_env?: boolean;
  /** Comma-separated executables, or omit to deny subprocess spawning. */
  allow_run?: string;
}

/** Payload for runner-stdout and runner-stderr events. */
export interface RunnerOutput {
  id: string;
  data: string;
}

/** Payload for the runner-exit event. */
export interface RunnerExit {
  id: string;
  /** Process exit code, or null if killed by a signal. */
  code: number | null;
}

// ── Commands ──────────────────────────────────────────────────────────────────

/** Spawn a new Deno subprocess. Rejects if a runner with this id is already running. */
export async function runnerSpawn(options: {
  id: string;
  script: string;
  args?: string[];
  permissions?: RunnerPermissions;
}): Promise<void> {
  return invoke('runner_spawn', {
    id: options.id,
    script: options.script,
    args: options.args ?? [],
    permissions: options.permissions ?? null,
  });
}

/** Write a string to the runner's stdin. */
export async function runnerSend(id: string, input: string): Promise<void> {
  return invoke('runner_send', { id, input });
}

/** Kill a running subprocess. No-ops if the id is not found. */
export async function runnerKill(id: string): Promise<void> {
  return invoke('runner_kill', { id });
}

/** Return the ids of all currently running subprocesses. */
export async function runnerList(): Promise<string[]> {
  return invoke('runner_list');
}

// ── Event listeners ───────────────────────────────────────────────────────────

/** Listen to stdout lines from any runner. Returns an unlisten function. */
export function onRunnerStdout(
  callback: (payload: RunnerOutput) => void
): Promise<UnlistenFn> {
  return listen<RunnerOutput>('runner-stdout', (e) => callback(e.payload));
}

/** Listen to stderr lines from any runner. Returns an unlisten function. */
export function onRunnerStderr(
  callback: (payload: RunnerOutput) => void
): Promise<UnlistenFn> {
  return listen<RunnerOutput>('runner-stderr', (e) => callback(e.payload));
}

/** Listen for runner exit events. Returns an unlisten function. */
export function onRunnerExit(
  callback: (payload: RunnerExit) => void
): Promise<UnlistenFn> {
  return listen<RunnerExit>('runner-exit', (e) => callback(e.payload));
}
