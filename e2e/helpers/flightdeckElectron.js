import { _electron as electron } from '@playwright/test';
import path from 'node:path';
import process from 'node:process';

const bounded = (promise, timeoutMs) => Promise.race([
  promise,
  new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    timer.unref?.();
  }),
]);

export const launchBuiltFlightDeck = async (testRoot) => {
  const electronEnv = {
    ...process.env,
    FLIGHTDECK_E2E: '1',
  };
  delete electronEnv.ELECTRON_RUN_AS_NODE;
  delete electronEnv.VITE_DEV_SERVER_URL;

  return electron.launch({
    args: ['.', `--user-data-dir=${path.join(testRoot, 'electron-profile')}`],
    env: electronEnv,
  });
};

export const closeFlightDeck = async (electronApp) => {
  if (!electronApp) return;
  const child = electronApp.process();
  await bounded(electronApp.close().catch(() => {}), 8_000);
  if (child?.exitCode === null) child.kill();
  if (child?.exitCode === null) {
    await bounded(new Promise((resolve) => child.once('exit', resolve)), 4_000);
  }
};
