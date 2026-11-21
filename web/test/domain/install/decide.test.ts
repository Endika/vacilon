import { describe, expect, it } from 'vitest';
import { detectIOS, installPath, shouldCleanup } from '../../../src/domain/install/decide';

describe('shouldCleanup', () => {
  it('cleans only when neither installed nor standalone', () => {
    expect(shouldCleanup({ installedFlag: false, standalone: false })).toBe(true);
    expect(shouldCleanup({ installedFlag: true, standalone: false })).toBe(false);
    expect(shouldCleanup({ installedFlag: false, standalone: true })).toBe(false);
    expect(shouldCleanup({ installedFlag: true, standalone: true })).toBe(false);
  });
});

describe('installPath', () => {
  it('hides the button when already installed', () => {
    expect(installPath({ hasPrompt: true, isIOS: false, standalone: true })).toBe('hidden');
    expect(
      installPath({ hasPrompt: false, isIOS: true, standalone: false, installedFlag: true }),
    ).toBe('hidden');
  });
  it('uses the native prompt when captured', () => {
    expect(installPath({ hasPrompt: true, isIOS: false, standalone: false })).toBe('prompt');
  });
  it('shows the guide on iOS without a prompt', () => {
    expect(installPath({ hasPrompt: false, isIOS: true, standalone: false })).toBe('ios-guide');
  });
  it('falls back to offline-only elsewhere', () => {
    expect(installPath({ hasPrompt: false, isIOS: false, standalone: false })).toBe('offline-only');
  });
});

describe('detectIOS', () => {
  it('detects iPhone by user agent', () => {
    expect(
      detectIOS({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });
  it('detects iPadOS posing as a Mac', () => {
    expect(
      detectIOS({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }),
    ).toBe(true);
  });
  it('rejects desktop Mac and Android', () => {
    expect(
      detectIOS({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }),
    ).toBe(false);
    expect(
      detectIOS({
        userAgent: 'Mozilla/5.0 (Linux; Android 14)',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      }),
    ).toBe(false);
  });
});
