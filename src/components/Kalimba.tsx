import React, { useEffect } from 'react';
import './Kalimba.css';

import { KALIMBA_KEYS, getTunedNote, parseNote } from '../constants/kalimba';

interface KalimbaProps {
  ppi: number;
  activeNotes: string[];
  fallingNotes: { id: string; note: string }[];
  isPlaying: boolean;
  onNoteClick: (note: string) => void;
  showNumbers: boolean;
  tuning: string;
}

const KalimbaKey = React.memo(({ 
  keyData, 
  isFirst, 
  isLast, 
  isActive, 
  fallingNotes,
  isPlaying,
  showNumbers, 
  onNoteClick,
  tuning
}: { 
  keyData: { note: string; label: string; octave: string }; 
  isFirst: boolean; 
  isLast: boolean; 
  isActive: boolean; 
  fallingNotes: {id: string; note: string}[];
  isPlaying: boolean;
  showNumbers: boolean; 
  onNoteClick: (note: string) => void;
  tuning: string;
}) => {
  return (
    <div
       className={`kalimba-key ${isFirst ? 'first-key' : ''} ${isLast ? 'last-key' : ''} ${isActive ? 'active' : ''}`}
       data-note={keyData.note}
       onClick={() => onNoteClick(getTunedNote(keyData.note, tuning))}
    >
      {/* 
        This is the secret weapon for iOS sync!
        We render a pure CSS flash with a 2000ms delay EXACTLY mapped to the dropping tile.
        This entirely skips React render latency at the 2000ms strike frame!
      */}
      {fallingNotes.map((note) => (
         <div 
           key={`glow-${note.id}`} 
           className="kalimba-key-glow"
           style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
         ></div>
      ))}

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
}, (prev, next) => {
  if (prev.isActive !== next.isActive) return false;
  if (prev.showNumbers !== next.showNumbers) return false;
  if (prev.isPlaying !== next.isPlaying) return false;
  if (prev.fallingNotes.length !== next.fallingNotes.length) return false;
  return true;
});

export const Kalimba: React.FC<KalimbaProps> = ({ ppi, activeNotes, fallingNotes, isPlaying, onNoteClick, showNumbers, tuning }) => {
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
          const isActive = activeNotes.some(activeNote => {
            const parsed = parseNote(activeNote);
            if (!parsed) return activeNote === keyData.note;
            return `${parsed.letter}${parsed.octave}` === keyData.note;
          });
          
          const keyFallingNotes = fallingNotes.filter(n => {
            const parsed = parseNote(n.note);
            if (!parsed) return n.note === keyData.note;
            return `${parsed.letter}${parsed.octave}` === keyData.note;
          });
          
          return (
            <KalimbaKey 
              key={keyData.note}
              keyData={keyData}
              isFirst={isFirst}
              isLast={isLast}
              isActive={isActive}
              fallingNotes={keyFallingNotes}
              isPlaying={isPlaying}
              showNumbers={showNumbers}
              onNoteClick={onNoteClick}
              tuning={tuning}
            />
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
