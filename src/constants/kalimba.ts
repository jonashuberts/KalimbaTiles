// Physical mapping of keys from left to right on the 17-key Kalimba
export const KALIMBA_KEYS = [
  { note: 'D6', label: '2', octave: '**' },
  { note: 'B5', label: '7', octave: '*' },
  { note: 'G5', label: '5', octave: '*' },
  { note: 'E5', label: '3', octave: '*' },
  { note: 'C5', label: '1', octave: '*' },
  { note: 'A4', label: '6', octave: '' },
  { note: 'F4', label: '4', octave: '' },
  { note: 'D4', label: '2', octave: '' },
  { note: 'C4', label: '1', octave: '' }, // Middle C
  { note: 'E4', label: '3', octave: '' },
  { note: 'G4', label: '5', octave: '' },
  { note: 'B4', label: '7', octave: '' },
  { note: 'D5', label: '2', octave: '*' },
  { note: 'F5', label: '4', octave: '*' },
  { note: 'A5', label: '6', octave: '*' },
  { note: 'C6', label: '1', octave: '**' },
  { note: 'E6', label: '3', octave: '**' },
];

export const TUNINGS: Record<string, Record<string, string>> = {
  'C Major': {},
  'G Major': { F: '#' },
  'D Major': { F: '#', C: '#' },
  'A Major': { F: '#', C: '#', G: '#' },
  'E Major': { F: '#', C: '#', G: '#', D: '#' },
  'B Major': { F: '#', C: '#', G: '#', D: '#', A: '#' },
  'F Major': { B: 'b' },
  'Bb Major': { B: 'b', E: 'b' },
  'Eb Major': { B: 'b', E: 'b', A: 'b' },
  'Ab Major': { B: 'b', E: 'b', A: 'b', D: 'b' },
};

export function parseNote(noteName: string) {
  const match = noteName.match(/^([A-G])([#b]?)(-?\d+|NO)$/i);
  if (match) {
    return { letter: match[1].toUpperCase(), accidental: match[2], octave: match[3] };
  }
  return null;
}

export function isAccidental(noteName: string, tuning: string) {
  const parsed = parseNote(noteName);
  if (!parsed) return false;
  const expectedAccidental = TUNINGS[tuning]?.[parsed.letter] || '';
  return parsed.accidental !== expectedAccidental;
}

export function getTunedNote(baseNote: string, tuning: string) {
  const parsed = parseNote(baseNote);
  if (!parsed) return baseNote;
  const accidental = TUNINGS[tuning]?.[parsed.letter] || '';
  return `${parsed.letter}${accidental}${parsed.octave}`;
}

const NOTE_INDEX: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11
};

export function getFrequencyFromNote(note: string): number | null {
  const parsed = parseNote(note);
  if (!parsed) return null;
  
  const noteName = `${parsed.letter}${parsed.accidental}`;
  const index = NOTE_INDEX[noteName];
  if (index === undefined) return null;
  
  const octave = parseInt(parsed.octave, 10);
  const midiNote = (octave + 1) * 12 + index;
  
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function getCentsOffPitch(freq: number, targetFreq: number): number {
  return 1200 * Math.log2(freq / targetFreq);
}
