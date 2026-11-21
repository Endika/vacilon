import { describe, expect, it } from 'vitest';
import { createTricks } from '../../../src/domain/tricks/registry';
import { route } from '../../../src/domain/conversation/route';

const tricks = createTricks(() => 0);

describe('route', () => {
  const aboutNames = true;

  it.each([true, false])('sends serious topics to the brain (follow-up pending: %s)', (pending) => {
    expect(
      route('tengo miedo, cuentame un chiste', { pendingFollowUp: pending, tricks, aboutNames }),
    ).toBe('brain');
  });

  it('prefers a trick over a pending follow-up', () => {
    const target = route('cuéntame un chiste', {
      pendingFollowUp: true,
      tricks,
      aboutNames: false,
    });
    expect(target).toMatchObject({ trick: { id: tricks[0].id } });
  });

  it('answers a pending follow-up when nothing else matches', () => {
    expect(route('el reloj', { pendingFollowUp: true, tricks, aboutNames: false })).toBe(
      'followUp',
    );
  });

  it('falls back to the brain', () => {
    expect(route('me gusta el helado', { pendingFollowUp: false, tricks, aboutNames: false })).toBe(
      'brain',
    );
  });

  it('sends names ahead of tricks and follow-ups but behind serious topics', () => {
    const ctx = { pendingFollowUp: true, tricks, aboutNames: true };
    expect(route('me llamo Irune', ctx)).toBe('names');
    expect(route('me llamo Irune y tengo miedo', ctx)).toBe('brain');
  });
});
