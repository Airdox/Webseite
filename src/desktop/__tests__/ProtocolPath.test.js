import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { resolveAppProtocolAssetPath } = require('../../../desktop/main/protocolPath.cjs');

describe('app protocol path resolver', () => {
  const appRoot = 'D:\\AIRDOX\\FlightDeck';
  const distRoot = path.join(appRoot, 'dist');

  it('resolves the default desktop document inside dist', () => {
    expect(resolveAppProtocolAssetPath({
      appRoot,
      requestUrl: 'app://flightdeck/',
    })).toBe(path.join(distRoot, 'desktop.html'));
  });

  it('keeps URL-normalized plain paths inside dist', () => {
    expect(resolveAppProtocolAssetPath({
      appRoot,
      requestUrl: 'app://flightdeck/../dist2/secret.txt',
    })).toBe(path.join(distRoot, 'dist2', 'secret.txt'));
  });

  it('keeps URL-normalized encoded dot segments inside dist', () => {
    expect(resolveAppProtocolAssetPath({
      appRoot,
      requestUrl: 'app://flightdeck/%2e%2e/dist2/secret.txt',
    })).toBe(path.join(distRoot, 'dist2', 'secret.txt'));
  });

  it('rejects encoded Windows-backslash traversal to sibling paths', () => {
    expect(resolveAppProtocolAssetPath({
      appRoot,
      requestUrl: 'app://flightdeck/%5c..%5cdist2%5csecret.txt',
    })).toBeNull();
  });

  it('rejects malformed encoded paths', () => {
    expect(resolveAppProtocolAssetPath({
      appRoot,
      requestUrl: 'app://flightdeck/%E0%A4%A',
    })).toBeNull();
  });
});
