import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

const port = 3005;
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = path.join('node_modules', 'next', 'dist', 'bin', 'next');
const playwrightCli = path.join('node_modules', '@playwright', 'test', 'cli.js');
const env = { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: 'true' };

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }

  return new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function waitForServer(child) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error('The Next.js production server exited before becoming ready.');
    }

    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // The server is still starting; retry until the startup deadline.
    }

    await delay(250);
  }

  throw new Error(`The production server did not respond at ${baseUrl} within 60 seconds.`);
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const exited = waitForExit(child);
  child.kill();
  const stopped = await Promise.race([
    exited.then(() => true),
    delay(3_000).then(() => false),
  ]);

  if (stopped || process.platform !== 'win32' || !child.pid) return;

  const taskkill = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
    stdio: 'inherit',
    windowsHide: true,
  });
  await waitForExit(taskkill);
  await Promise.race([exited, delay(3_000)]);
}

async function main() {
  let server;
  let exitCode = 1;

  try {
    let portIsInUse = false;
    try {
      await fetch(baseUrl, { signal: AbortSignal.timeout(750) });
      portIsInUse = true;
    } catch {
      // No server is listening yet.
    }
    if (portIsInUse) {
      throw new Error(`Port ${port} already serves a site. Stop it before running the E2E suite.`);
    }

    server = spawn(process.execPath, [nextCli, 'start', '-p', String(port)], {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
      windowsHide: true,
    });

    await waitForServer(server);

    const testRun = spawn(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
      windowsHide: true,
    });
    const result = await waitForExit(testRun);
    exitCode = result.code ?? 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'End-to-end test runner failed.');
  } finally {
    if (server) await stopServer(server);
  }

  process.exitCode = exitCode;
}

main();
