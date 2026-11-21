import { describe, expect, it } from 'vitest';
import { actionFor } from '../../../src/domain/ear/action';
import { EARS_LOADING, EAR_ERROR, MIC_DENIED, NOT_HEARD } from '../../../src/domain/ear/phrases';
import { isSafe } from '../../../src/domain/conversation/safety';

describe('what Chispa does with what she heard', () => {
  it('submits recognised text', () => {
    expect(actionFor({ kind: 'text', text: 'hola chispa' })).toEqual({
      kind: 'submit',
      text: 'hola chispa',
    });
  });

  it('asks again, explains the permission or apologises when nothing came out', () => {
    expect(actionFor({ kind: 'empty' })).toEqual({ kind: 'say', text: NOT_HEARD });
    expect(actionFor({ kind: 'empty' }, true)).toEqual({ kind: 'say', text: EARS_LOADING });
    expect(actionFor({ kind: 'denied' })).toEqual({ kind: 'say', text: MIC_DENIED });
    expect(actionFor({ kind: 'error' })).toEqual({ kind: 'say', text: EAR_ERROR });
  });

  it('hides the button when the ear is unavailable', () => {
    expect(actionFor({ kind: 'unavailable' })).toEqual({ kind: 'hide' });
  });

  it('only says safe, bubble-sized phrases', () => {
    for (const text of [NOT_HEARD, MIC_DENIED, EAR_ERROR, EARS_LOADING]) {
      expect(isSafe(text), text).toBe(true);
      expect(text.length, text).toBeLessThanOrEqual(140);
    }
  });
});
