import type { EarResult } from './result';
import { EARS_LOADING, EAR_ERROR, MIC_DENIED, NOT_HEARD } from './phrases';

export type EarAction =
  { kind: 'submit'; text: string } | { kind: 'say'; text: string } | { kind: 'hide' };

/** `loading`: the model was still downloading when she let go. */
export function actionFor(result: EarResult, loading = false): EarAction {
  switch (result.kind) {
    case 'text':
      return { kind: 'submit', text: result.text };
    case 'empty':
      return { kind: 'say', text: loading ? EARS_LOADING : NOT_HEARD };
    case 'denied':
      return { kind: 'say', text: MIC_DENIED };
    case 'unavailable':
      return { kind: 'hide' };
    case 'error':
      return { kind: 'say', text: EAR_ERROR };
  }
}
