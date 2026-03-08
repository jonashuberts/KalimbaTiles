import React, { useEffect } from 'react';
import './Kalimba.css';

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

interface KalimbaProps {
  ppi: number;
  activeNotes: string[];
  onNoteClick: (note: string) => void;
  showNumbers: boolean;
}

export const Kalimba: React.FC<KalimbaProps> = ({ ppi, activeNotes, onNoteClick, showNumbers }) => {
  // Update the CSS variable whenever the PPI changes so hardware dimensions scale correctly
  useEffect(() => {
    document.documentElement.style.setProperty('--ppi', ppi.toString());
  }, [ppi]);

  return (
    <div className="kalimba-container">
      <div className="kalimba-board">
        {KALIMBA_KEYS.map((keyData, index) => {
          const isFirst = index === 0;
          const isLast = index === KALIMBA_KEYS.length - 1;
          const isActive = activeNotes.includes(keyData.note);
          
          return (
            <div
               key={keyData.note}
               className={`kalimba-key ${isFirst ? 'first-key' : ''} ${isLast ? 'last-key' : ''} ${isActive ? 'active' : ''}`}
               data-note={keyData.note}
               onClick={() => onNoteClick(keyData.note)}
            >
              {showNumbers && (
                <div className="key-label">
                  <span className="key-number">{keyData.label}</span>
                  <span className="key-octave">
                    {keyData.octave === '*' ? '•' : keyData.octave === '**' ? '••' : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {/* Hardware Pads for Visual Authenticity */}
        <div className="bottom-pad pad-1"></div>
        <div className="top-pad"></div>
        <div className="bottom-pad pad-2"></div>
      </div>
    </div>
  );
};
