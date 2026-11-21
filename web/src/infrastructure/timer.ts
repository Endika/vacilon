import type { StartTimer } from '../application/listening';

export const browserTimer: StartTimer = (run, ms) => {
  const id = window.setTimeout(run, ms);
  return () => window.clearTimeout(id);
};
