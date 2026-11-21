export interface CleanupState {
  installedFlag: boolean;
  standalone: boolean;
}

export interface InstallState {
  hasPrompt: boolean;
  isIOS: boolean;
  standalone: boolean;
  installedFlag?: boolean;
}

export type InstallPath = 'hidden' | 'prompt' | 'ios-guide' | 'offline-only';

export function shouldCleanup({ installedFlag, standalone }: CleanupState): boolean {
  return !installedFlag && !standalone;
}

export function installPath({
  hasPrompt,
  isIOS,
  standalone,
  installedFlag,
}: InstallState): InstallPath {
  if (standalone || installedFlag) return 'hidden';
  if (hasPrompt) return 'prompt';
  if (isIOS) return 'ios-guide';
  return 'offline-only';
}

export interface PlatformHints {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

export function detectIOS({ userAgent, platform, maxTouchPoints }: PlatformHints): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return platform === 'MacIntel' && maxTouchPoints > 1;
}
