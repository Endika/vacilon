export interface Joke {
  setup: string;
  punchline: string;
}

export interface Riddle {
  question: string;
  /** Normalized like the filter (lower case, no accents, ñ as ny); any whole-word hit counts. */
  answers: string[];
  solution: string;
}

/** A pitch such as `C5` or `F#4`, or `null` for a rest; the length is in beats. */
export type Note = [pitch: string | null, beats: number];

export interface SongLine {
  text: string;
  notes: Note[];
}

export interface Song {
  title: string;
  bpm: number;
  lines: SongLine[];
}

export interface Fact {
  text: string;
  /** A question that invites the child to keep talking. */
  hook: string;
}
