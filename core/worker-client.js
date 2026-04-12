'use strict';

const http = require('node:http');
const { execFileSync, spawn } = require('node:child_process');
const { resolveClaudeMemPaths } = require('./paths.js');

const DEFAULT_HEALTH_TIMEOUT_MS = 2_000;
const DEFAULT_HOOK_TIMEOUT_MS = 55_000;
const DEFAULT_SESSION_TIMEOUT_MS = 3_000;
const DEFAULT_WORKER_PORT = 37_777;
const DEFAULT_RETRY_COUNT = 5;
const DEFAULT_RETRY_DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHealthUrl(workerPort) {
  return `http://127.0.0.1:${workerPort}/health`;
}

function createWorkerClient(options = {}) {
  const paths = options.paths ?? resolveClaudeMemPaths(options);
  const workerPort = options.workerPort ?? DEFAULT_WORKER_PORT;
  const httpClient = options.http ?? http;
  const exec = options.execFileSync ?? execFileSync;
  const spawnFn = options.spawn ?? spawn;
  const command = options.command ?? process.execPath;
  const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const healthTimeoutMs = options.healthTimeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS;
  const hookTimeoutMs = options.hookTimeoutMs ?? DEFAULT_HOOK_TIMEOUT_MS;
  const sessionTimeoutMs = options.sessionTimeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS;

  function checkHealth() {
    return new Promise((resolve) => {
      const req = httpClient.get(buildHealthUrl(workerPort), (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.setTimeout(healthTimeoutMs, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  function startWorker() {
    const child = spawnFn(command, [paths.bunRunner, paths.workerService, 'start'], {
      detached: true,
      stdio: 'ignore',
    });

    if (child && typeof child.unref === 'function') {
      child.unref();
    }

    return child;
  }

  async function ensureWorker() {
    if (await checkHealth()) {
      return true;
    }

    startWorker();

    for (let i = 0; i < retryCount; i += 1) {
      await sleep(retryDelayMs);
      if (await checkHealth()) {
        return true;
      }
    }

    return false;
  }

  function runHook(provider, phase, payload) {
    const workerArgs = [paths.bunRunner, paths.workerService, 'hook', provider, phase];
    const result = exec(
      command,
      workerArgs,
      {
        input: JSON.stringify(payload ?? {}),
        encoding: 'utf8',
        timeout: hookTimeoutMs,
      }
    );

    if (!result) {
      return { continue: true };
    }

    return JSON.parse(result);
  }

  async function completeSession(sessionId) {
    if (!sessionId) {
      return false;
    }

    let acknowledged = false;

    await new Promise((resolve) => {
      const req = httpClient.request(
        {
          hostname: '127.0.0.1',
          port: workerPort,
          path: '/api/sessions/complete',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          acknowledged = res.statusCode >= 200 && res.statusCode < 300;
          resolve();
        }
      );

      req.on('error', () => {
        acknowledged = false;
        resolve();
      });
      req.setTimeout(sessionTimeoutMs, () => {
        acknowledged = false;
        req.destroy();
        resolve();
      });
      req.end(JSON.stringify({ contentSessionId: sessionId }));
    });

    return acknowledged;
  }

  return {
    checkHealth,
    completeSession,
    ensureWorker,
    paths,
    runHook,
    startWorker,
  };
}

module.exports = {
  createWorkerClient,
};
