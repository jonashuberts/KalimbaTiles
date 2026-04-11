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
