import React, { useEffect } from 'react';
import './Kalimba.css';

import { KALIMBA_KEYS } from '../constants/kalimba';

interface KalimbaProps {
  ppi: number;
  activeNotes: string[];
  fallingNotes: { id: string; note: string }[];
  isPlaying: boolean;
  onNoteClick: (note: string) => void;
  showNumbers: boolean;
}

const KalimbaKey = React.memo(({ 
  keyData, 
  isFirst, 
  isLast, 
  isActive, 
  fallingNotes,
  isPlaying,
  showNumbers, 
  onNoteClick 
}: { 
  keyData: { note: string; label: string; octave: string }; 
  isFirst: boolean; 
  isLast: boolean; 
  isActive: boolean; 
  fallingNotes: {id: string; note: string}[];
  isPlaying: boolean;
  showNumbers: boolean; 
  onNoteClick: (note: string) => void;
}) => {
  return (
    <div
       className={`kalimba-key ${isFirst ? 'first-key' : ''} ${isLast ? 'last-key' : ''} ${isActive ? 'active' : ''}`}
       data-note={keyData.note}
       onClick={() => onNoteClick(keyData.note)}
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

export const Kalimba: React.FC<KalimbaProps> = ({ ppi, activeNotes, fallingNotes, isPlaying, onNoteClick, showNumbers }) => {
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
          const keyFallingNotes = fallingNotes.filter(n => n.note === keyData.note);
          
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
