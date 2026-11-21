import { detectIOS, installPath, shouldCleanup } from '../../domain/install/decide';

const FLAG_KEY = 'chispa.installed';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

function readFlag(): boolean {
  try {
    return localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function writeFlag(): void {
  try {
    localStorage.setItem(FLAG_KEY, '1');
  } catch {
    // Storage blocked: the service worker is still registered for this session.
  }
}

function isStandalone(): boolean {
  const legacy = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return legacy || window.matchMedia('(display-mode: standalone)').matches;
}

async function cleanup(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

export function setupInstall(button: HTMLButtonElement, guide: HTMLElement): void {
  let deferred: InstallPromptEvent | null = null;

  const refresh = (): void => {
    button.hidden =
      installPath({
        hasPrompt: deferred !== null,
        isIOS: detectIOS(navigator),
        standalone: isStandalone(),
        installedFlag: readFlag(),
      }) === 'hidden';
  };

  if (shouldCleanup({ installedFlag: readFlag(), standalone: isStandalone() })) {
    void cleanup().catch(() => undefined);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    writeFlag();
    refresh();
  });

  button.addEventListener('click', () => {
    const path = installPath({
      hasPrompt: deferred !== null,
      isIOS: detectIOS(navigator),
      standalone: isStandalone(),
    });
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href);
    }
    writeFlag();
    if (path === 'prompt' && deferred) {
      void deferred.prompt();
      deferred = null;
    } else if (path === 'ios-guide') {
      guide.hidden = false;
    }
    refresh();
  });

  guide.querySelector('button')?.addEventListener('click', () => {
    guide.hidden = true;
  });
  refresh();
}
