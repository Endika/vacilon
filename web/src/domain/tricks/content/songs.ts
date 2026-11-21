import type { Song } from './types';

const n = (pitches: string, beats: string): [string | null, number][] => {
  const p = pitches.split(' ');
  const b = beats.split(' ').map(Number);
  if (p.length !== b.length) throw new Error(`notes and beats differ: ${pitches}`);
  return p.map((pitch, i) => [pitch === '-' ? null : pitch, b[i]]);
};

export const SONGS: Song[] = [
  {
    title: 'Soy un huevito',
    bpm: 132,
    lines: [
      {
        text: 'Soy un huevito que flota, flota,',
        notes: n('C5 C5 E5 E5 G5 G5 A5 G5 A5 G5 -', '.5 .5 .5 .5 .5 .5 .5 .5 .5 1 .5'),
      },
      {
        text: 'blanco y rosa, bip, bop, bip,',
        notes: n('F5 F5 E5 E5 D5 G5 C5 G5 -', '.5 .5 .5 .5 1 .5 .5 1 .5'),
      },
      {
        text: 'si me haces cosquillas me río',
        notes: n('C5 C5 E5 E5 G5 G5 A5 A5 G5 E5 -', '.5 .5 .5 .5 .5 .5 .5 .5 .5 1 .5'),
      },
      {
        text: '¡y hago chispas al reír!',
        notes: n('F5 E5 D5 D5 E5 D5 C5 C5', '.5 .5 .5 .5 .5 .5 1 1.5'),
      },
    ],
  },
  {
    title: 'La canción del mareo',
    bpm: 126,
    lines: [
      {
        text: 'Un, dos, tres, me pongo a girar,',
        notes: n('C5 D5 E5 E5 F5 G5 G5 A5 G5 -', '.5 .5 1 .5 .5 .5 .5 .5 1 .5'),
      },
      {
        text: 'cuatro, cinco, seis, vuelvo a flotar,',
        notes: n('D5 D5 E5 E5 F5 F5 E5 D5 E5 C5 -', '.5 .5 .5 .5 1 .5 .5 .5 .5 1 .5'),
      },
      {
        text: 'siete, ocho, nueve, ¡qué mareo me da!',
        notes: n('G5 G5 A5 A5 B5 B5 C6 B5 A5 G5 F5 E5 -', '.5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 1 .5'),
      },
      {
        text: 'diez: ¡ya está! ¡A descansar!',
        notes: n('G5 E5 D5 C5 D5 E5 C5', '1 .5 .5 1 .5 .5 1.5'),
      },
    ],
  },
];

export const DANCES: Song[] = [
  {
    title: 'Baile del bip',
    bpm: 140,
    lines: [
      { text: '', notes: n('C5 E5 G5 E5 A5 G5 E5', '.5 .5 .5 .5 .5 .5 1') },
      { text: '', notes: n('C5 E5 G5 E5 A5 G5 E5', '.5 .5 .5 .5 .5 .5 1') },
      { text: '', notes: n('F5 A5 C6 A5 G5 E5 C5', '.5 .5 .5 .5 .5 .5 1') },
      { text: '', notes: n('D5 E5 F5 G5 C6', '.5 .5 .5 .5 2') },
      { text: '', notes: n('C5 E5 G5 E5 A5 G5 C6', '.5 .5 .5 .5 .5 .5 1') },
    ],
  },
  {
    title: 'Baile del tornillo',
    bpm: 132,
    lines: [
      { text: '', notes: n('A4 A4 C5 A4 D5 C5 A4', '.5 .5 .5 .5 .5 .5 1') },
      { text: '', notes: n('G4 G4 B4 G4 C5 B4 G4', '.5 .5 .5 .5 .5 .5 1') },
      { text: '', notes: n('A4 A4 C5 A4 D5 C5 A4', '.5 .5 .5 .5 .5 .5 1') },
      { text: '', notes: n('E5 D5 C5 B4 A4', '.5 .5 .5 .5 2') },
    ],
  },
];

export const SING_INTROS = [
  '¡Atención, que canto!',
  '¡Música, maestro! Bueno, maestra soy yo.',
  'Me sé una canción. ¡Ahí va!',
];
export const DANCE_INTROS = [
  '¡Me pongo a bailar!',
  '¡Música! Mira cómo muevo la cáscara.',
  '¡Bip bop, a bailar!',
];
export const ENDINGS = ['¡Tachán!', '¡Bip! ¿Te ha gustado?', '¡Bip bop! Cuando quieras, otra.'];
