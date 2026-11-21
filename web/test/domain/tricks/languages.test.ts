import { describe, expect, it } from 'vitest';
import { isSafe, normalizeForFilter } from '../../../src/domain/conversation/safety';
import { mulberry32 } from '../../../src/domain/random';
import {
  ASK_MEANING,
  ASK_WORD,
  LANGUAGE_AGAIN,
  LANGUAGE_INTROS,
  SAY_MEANING,
  SAY_SOUNDS,
  SAY_WORD,
  WORD_HOOKS,
  WORD_UNKNOWN,
  WORDS,
  type Language,
} from '../../../src/domain/tricks/content/words';
import { createLanguageQuiz, quizWords } from '../../../src/domain/tricks/language-quiz';
import { createLanguages, sayWord } from '../../../src/domain/tricks/languages';
import { createTricks, matchTrick } from '../../../src/domain/tricks/registry';
import { PASS, type FollowUp } from '../../../src/domain/tricks/types';
import { createVocabulary } from '../../../src/domain/tricks/vocabulary';
import { fakeStage, said } from './stage';

const MAX_CHARS = 140;
const tricks = createTricks(mulberry32(1));
const idFor = (text: string) => matchTrick(text, tricks)?.id ?? null;

async function ask(text: string, seed = 1): Promise<string> {
  const { stage, calls } = fakeStage();
  await createLanguages(mulberry32(seed)).run(stage, text);
  return said(calls).join(' ');
}

describe('language triggers', () => {
  it.each([
    ['¿cómo se dice perro en inglés?', 'languages'],
    ['cómo se dice el gato en euskera', 'languages'],
    ['¿Cómo se dice en inglés mariposa?', 'languages'],
    ['dime hola en euskera', 'languages'],
    ['¿qué significa dog?', 'languages'],
    ['qué significa txakurra en euskera', 'languages'],
    ['¿cómo se dice cat en castellano?', 'languages'],
    ['juguemos al inglés', 'language-quiz'],
    ['quiero jugar a los idiomas', 'language-quiz'],
    ['enséñame euskera', 'language-quiz'],
    ['¿hablas inglés?', 'language-quiz'],
    ['un concurso de inglés', 'language-quiz'],
    ['¿cómo se dice hola en Morse?', 'morse'],
  ])('%s -> %s', (text, id) => {
    expect(idFor(text)).toBe(id);
  });

  it.each([
    'me gusta el inglés',
    'mi profe de inglés es muy maja',
    'hablo euskera en el cole',
    '¿qué significa eso?',
    'mi perro se llama Toby',
  ])('%s -> none', (text) => {
    expect(idFor(text)).toBeNull();
  });
});

describe('translating words', () => {
  it('says a word in English with how it sounds', async () => {
    const text = await ask('¿cómo se dice casa en inglés?');
    expect(text).toMatch(/«house»\. Suena así: «jaus»\. .*[?!]$/);
  });

  it('says a word in Basque, with or without the article in the question', async () => {
    expect(await ask('¿cómo se dice el perro en euskera?')).toContain('«txakurra»');
    expect(await ask('¿Cómo se dice en vasco gracias?')).toContain('«eskerrik asko»');
  });

  it('repeats the Spanish form it was asked for', async () => {
    expect(await ask('cómo se dice pequeña en inglés')).toContain('«pequeña»');
  });

  it('explains Basque words that depend on who speaks', async () => {
    expect(await ask('¿cómo se dice hermana en euskera?')).toContain('«ahizpa»');
  });

  it('tells what a foreign word means', async () => {
    expect(await ask('¿qué significa dog?')).toMatch(/^«Dog» en inglés significa «perro»\./);
    expect(await ask('¿qué significa etxea?')).toMatch(/^«Etxea» en euskera significa «casa»\./);
    expect(await ask('cómo se dice horse en castellano')).toContain('«caballo»');
  });

  it('owns up to words it does not know without repeating them', async () => {
    const text = await ask('¿cómo se dice dinosaurio en inglés?');
    expect(WORD_UNKNOWN).toContain(text);
  });

  it('knows every Spanish form of every word', () => {
    const vocabulary = createVocabulary(WORDS);
    for (const word of WORDS)
      for (const es of word.es)
        expect(vocabulary.fromSpanish(normalizeForFilter(es)), es).toBe(word);
  });

  it('never gives one Spanish form two meanings', () => {
    const forms = WORDS.flatMap((w) => w.es.map(normalizeForFilter));
    expect(new Set(forms).size).toBe(forms.length);
  });
});

describe('language quiz', () => {
  async function start(text: string, seed: number) {
    const { stage, calls } = fakeStage();
    const followUp = await createLanguageQuiz(mulberry32(seed)).run(stage, text);
    return { question: said(calls)[0], followUp: followUp as FollowUp };
  }

  async function reply(followUp: FollowUp, text: string) {
    const { stage, calls } = fakeStage();
    const next = await followUp(text, stage);
    return { next, lines: said(calls) };
  }

  function answerTo(question: string, language: Language): string {
    const toForeign = /¿Cómo se dice «(.+?)»/.exec(question);
    if (toForeign) return WORDS.find((w) => w.es[0] === toForeign[1])![language][0];
    const toSpanish = /¿Qué significa «(.+?)»/.exec(question)!;
    return WORDS.find((w) => w[language][0] === toSpanish[1])!.es[0];
  }

  it('accepts the right answer in both directions and offers another', async () => {
    const directions = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const { question, followUp } = await start('juguemos al inglés', seed);
      directions.add(question.includes('significa') ? 'toSpanish' : 'toForeign');
      const { next, lines } = await reply(followUp, answerTo(question, 'en'));
      expect(lines[0], question).toMatch(/¡Correcto!/);
      expect(next).toBeTypeOf('function');
    }
    expect(directions).toEqual(new Set(['toSpanish', 'toForeign']));
  });

  it('accepts Basque answers without the article', async () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { question, followUp } = await start('juguemos al euskera', seed);
      if (!question.includes('¿Cómo se dice')) continue;
      const answer = answerTo(question, 'eu').replace(/a$/, '');
      const { lines } = await reply(followUp, answer);
      expect(lines[0], `${question} ${answer}`).toMatch(/¡Correcto!/);
    }
  });

  it('gives a hint, then the answer', async () => {
    const { followUp } = await start('juguemos al inglés', 3);
    const first = await reply(followUp, 'zapato');
    expect(first.lines[0]).toMatch(/Pista: empieza por la «.»/);
    const second = await reply(first.next as FollowUp, 'zapato');
    expect(second.lines[0]).toMatch(/«.+» en inglés (se dice|significa) «.+»/);
  });

  it('leaves long unrelated messages to the conversation', async () => {
    const { followUp } = await start('juguemos al inglés', 3);
    const nudged = await reply(followUp, 'oye que hoy he ido al parque con mi tía');
    const passed = await reply(nudged.next as FollowUp, 'y luego hemos merendado mucho');
    expect(passed.next).toBe(PASS);
  });

  it('only asks words that differ from Spanish', () => {
    const asked = (language: Language) => quizWords(language).map((w) => w.es[0]);
    expect(asked('en').length).toBeGreaterThan(140);
    expect(asked('eu').length).toBeGreaterThan(140);
    expect(asked('en')).not.toContain('chocolate');
    expect(asked('eu')).not.toContain('patata');
    expect(asked('eu')).not.toContain('hermano');
  });
});

describe('language content', () => {
  it('passes the word filter and fits a bubble', () => {
    const replies = WORDS.flatMap((word) =>
      (['en', 'eu'] as const).flatMap((language) =>
        SAY_WORD.map((t) => `${sayWord(word, language, t)} ${WORD_HOOKS[0]}`),
      ),
    );
    const lines = [
      ...replies,
      ...WORD_HOOKS,
      ...WORD_UNKNOWN,
      ...LANGUAGE_INTROS.map((i) => `${i} ${ASK_MEANING}`),
      ...LANGUAGE_INTROS.map((i) => `${i} ${ASK_WORD}`),
      ...LANGUAGE_AGAIN,
      SAY_MEANING,
      SAY_SOUNDS,
    ];
    for (const line of lines) {
      expect(isSafe(line), line).toBe(true);
      expect(line.length, line).toBeLessThanOrEqual(MAX_CHARS);
    }
  });

  it('has about 150 words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(150);
  });
});
