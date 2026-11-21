import { describe, expect, it } from 'vitest';
import { pickVoice, type VoiceInfo } from '../../../src/infrastructure/voice/voices';

const v = (name: string, lang: string, localService = true): VoiceInfo => ({
  name,
  lang,
  localService,
});

describe('pickVoice', () => {
  it('returns null when there are no voices', () => {
    expect(pickVoice([])).toBeNull();
  });

  it('returns null when no voice speaks Spanish', () => {
    expect(pickVoice([v('Samantha', 'en-US'), v('Amelie', 'fr-FR')])).toBeNull();
  });

  it('prefers es-ES over other Spanish variants', () => {
    const voices = [v('Paulina', 'es-MX'), v('Monica', 'es-ES'), v('Jorge', 'es-AR')];
    expect(pickVoice(voices)?.name).toBe('Monica');
  });

  it('falls back to any es-* voice', () => {
    expect(pickVoice([v('Samantha', 'en-US'), v('Paulina', 'es-MX')])?.name).toBe('Paulina');
  });

  it('accepts Android style es_ES codes', () => {
    expect(pickVoice([v('Google', 'en_US'), v('Google español', 'es_ES')])?.name).toBe(
      'Google español',
    );
  });

  it('prefers a local es-ES voice over a remote one', () => {
    const voices = [v('Remota', 'es-ES', false), v('Local', 'es-ES', true)];
    expect(pickVoice(voices)?.name).toBe('Local');
  });

  it('takes a local es-MX voice over a remote es-ES one', () => {
    const voices = [v('Remota ES', 'es-ES', false), v('Local MX', 'es-MX', true)];
    expect(pickVoice(voices)?.name).toBe('Local MX');
  });

  it('never picks a remote voice', () => {
    expect(pickVoice([v('Remota ES', 'es-ES', false)])).toBeNull();
  });

  it('is case insensitive and keeps the first of equals', () => {
    expect(pickVoice([v('Primera', 'ES-es'), v('Segunda', 'es-ES')])?.name).toBe('Primera');
  });
});
