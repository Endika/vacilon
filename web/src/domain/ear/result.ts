export type EarResult =
  | { kind: 'text'; text: string }
  | { kind: 'empty' }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  | { kind: 'error' };
