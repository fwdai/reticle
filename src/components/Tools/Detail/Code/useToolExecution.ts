import { useState } from 'react';
import type { Tool } from '../../types';
import {
  writeTempScript,
  deleteTempScript,
  runnerSpawn,
  runnerSend,
  onRunnerStdout,
  onRunnerStderr,
  onRunnerExit,
} from '@/lib/runner';
import { listEnvVariables } from '@/lib/storage';

// Matches the boilerplate in gateway/helpers.ts — reads args from stdin, calls handler, prints result
const HANDLER_BOILERPLATE = `
const raw = await new Promise((resolve) => {
  let buf = "";
  const decoder = new TextDecoder();
  async function read() {
    for await (const chunk of Deno.stdin.readable) {
      buf += decoder.decode(chunk);
      if (buf.includes("\\n")) { resolve(buf.trim()); return; }
    }
  }
  read();
});
const args = JSON.parse(raw);
const result = await handler(args);
console.log(JSON.stringify(result));
`;

export type LogEntry =
  | { type: 'call'; args: Record<string, unknown>; timestamp: number }
  | { type: 'stdout'; text: string }
  | { type: 'result'; value: unknown; elapsedMs: number }
  | { type: 'error'; message: string; elapsedMs: number };

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export function useToolExecution(tool: Tool) {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [testArgs, setTestArgs] = useState('{}');
  const [argsError, setArgsError] = useState(false);

  function clearLogs() {
    setLogs([]);
    setStatus('idle');
  }

  async function execute() {
    if (status === 'running' || !tool.code?.trim()) return;

    let parsedArgs: Record<string, unknown>;
    try {
      const parsed = JSON.parse(testArgs);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('must be an object');
      }
      parsedArgs = parsed;
      setArgsError(false);
    } catch {
      setArgsError(true);
      return;
    }

    const startTime = Date.now();
    const runnerId = crypto.randomUUID();

    setStatus('running');
    setLogs([{ type: 'call', args: parsedArgs, timestamp: Date.now() }]);

    const envVars = await listEnvVariables();
    const envMap = Object.fromEntries(envVars.map((v) => [v.key, v.value]));
    const envPreamble = `const env = ${JSON.stringify(envMap)};\n`;

    let scriptPath: string;
    try {
      scriptPath = await writeTempScript(runnerId, envPreamble + tool.code + HANDLER_BOILERPLATE);
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        { type: 'error', message: String(err), elapsedMs: Date.now() - startTime },
      ]);
      setStatus('error');
      return;
    }

    // stdout lines — the last one is the boilerplate's JSON result
    const stdoutLines: string[] = [];
    // stderr accumulates the full error trace
    let stderrBuf = '';

    const unlistenOut = await onRunnerStdout((p) => {
      if (p.id !== runnerId) return;
      const lines = p.data.split('\n').filter(Boolean);
      for (const line of lines) {
        stdoutLines.push(line);
        setLogs((prev) => [...prev, { type: 'stdout', text: line }]);
      }
    });

    const unlistenErr = await onRunnerStderr((p) => {
      if (p.id !== runnerId) return;
      stderrBuf += p.data;
    });

    const unlistenExit = await onRunnerExit((p) => {
      if (p.id !== runnerId) return;
      unlistenOut();
      unlistenErr();
      unlistenExit();
      deleteTempScript(scriptPath).catch(() => { });
      const elapsedMs = Date.now() - startTime;

      if (p.code === 0) {
        // The last stdout line is the JSON-serialised return value from the boilerplate
        const resultLine = stdoutLines[stdoutLines.length - 1] ?? '';
        let value: unknown;
        try {
          value = JSON.parse(resultLine);
        } catch {
          value = resultLine;
        }

        setLogs((prev) => {
          // Remove the last stdout entry (it's the boilerplate result line, not a console.log)
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].type === 'stdout') {
              next.splice(i, 1);
              break;
            }
          }
          return [...next, { type: 'result', value, elapsedMs }];
        });
        setStatus('success');
      } else {
        const message = stderrBuf.trim() || `Process exited with code ${p.code}`;
        setLogs((prev) => [...prev, { type: 'error', message, elapsedMs }]);
        setStatus('error');
      }
    });

    try {
      await runnerSpawn({
        id: runnerId,
        script: scriptPath,
        permissions: { allow_net: '*', allow_env: true },
      });
      await runnerSend(runnerId, JSON.stringify(parsedArgs) + '\n');
    } catch (err) {
      unlistenOut();
      unlistenErr();
      unlistenExit();
      deleteTempScript(scriptPath).catch(() => { });
      setLogs((prev) => [
        ...prev,
        { type: 'error', message: String(err), elapsedMs: Date.now() - startTime },
      ]);
      setStatus('error');
    }
  }

  return { status, logs, testArgs, setTestArgs, argsError, execute, clearLogs };
}
