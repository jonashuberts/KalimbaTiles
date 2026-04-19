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
  isTuningMode?: boolean;
  selectedTuningKey?: string | null;
  currentTuningCents?: number | null;
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
  tuning,
  isTuningActive,
  tuneCents
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
  isTuningActive?: boolean;
  tuneCents?: number | null;
}) => {

  const getTuneStatus = () => {
    if (!isTuningActive || tuneCents === null || tuneCents === undefined) return '';
    if (Math.abs(tuneCents) <= 10) return 'perfect';
    if (tuneCents < -10) return 'flat'; // Too low, hammer UP
    if (tuneCents > 10) return 'sharp'; // Too high, hammer DOWN
    return '';
  };

  const status = getTuneStatus();

  return (
    <div
       className={`kalimba-key ${isFirst ? 'first-key' : ''} ${isLast ? 'last-key' : ''} ${isActive ? 'active' : ''} ${isTuningActive ? 'tuning-focus' : ''} ${status ? `tune-${status}` : ''}`}
       data-note={keyData.note}
       onClick={() => onNoteClick(getTunedNote(keyData.note, tuning))}
    >
      {fallingNotes.map((note) => (
         <div 
           key={`glow-${note.id}`} 
           className="kalimba-key-glow"
           style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
         ></div>
      ))}

      {isTuningActive && status && (
        <div className="tuning-indicator">
          {status === 'flat' && <span className="tune-arrow up">↑</span>}
          {status === 'sharp' && <span className="tune-arrow down">↓</span>}
          {status === 'perfect' && <span className="tune-dot">●</span>}
        </div>
      )}

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
  if (prev.tuning !== next.tuning) return false;
  if (prev.isTuningActive !== next.isTuningActive) return false;
  if (prev.tuneCents !== next.tuneCents) return false;
  if (prev.fallingNotes.length !== next.fallingNotes.length) return false;
  return true;
});

export const Kalimba: React.FC<KalimbaProps> = ({ 
  ppi, 
  activeNotes, 
  fallingNotes, 
  isPlaying, 
  onNoteClick, 
  showNumbers, 
  tuning,
  isTuningMode,
  selectedTuningKey,
  currentTuningCents
}) => {
  useEffect(() => {
    document.documentElement.style.setProperty('--ppi', ppi.toString());
  }, [ppi]);

  return (
    <div className={`kalimba-container ${isTuningMode ? 'tuning-mode-active' : ''}`}>
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

          const tunedNote = getTunedNote(keyData.note, tuning);
          const isTuningActive = isTuningMode && selectedTuningKey === tunedNote;
          
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
              isTuningActive={isTuningActive}
              tuneCents={isTuningActive ? currentTuningCents : null}
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
