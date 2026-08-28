import React, { useEffect } from 'react';
import './Kalimba.css';

import { KALIMBA_KEYS, getTunedNote, parseNote } from '../constants/kalimba';
import { ArrowUp, ArrowDown, Circle } from 'lucide-react';

interface KalimbaProps {
  ppi: number;
  activeNotes: string[];
  fallingNotes?: { id: string; note: string }[];
  isPlaying: boolean;
  onNoteClick: (note: string) => void;
  showNumbers: boolean;
  tuning: string;
  isTuningMode?: boolean;
  selectedTuningKey?: string | null;
  currentTuningCents?: number | null;
  tuningMemory?: Record<string, 'perfect' | 'sharp' | 'flat'>;
}

const KalimbaKey = React.memo(({ 
  keyData, 
  isFirst, 
  isLast, 
  isActive, 
  showNumbers, 
  onNoteClick,
  tuning,
  isTuningMode,
  isTuningActive,
  memoryStatus,
  tuneCents
}: { 
  keyData: { note: string; label: string; octave: string }; 
  isFirst: boolean; 
  isLast: boolean; 
  isActive: boolean; 
  showNumbers: boolean; 
  onNoteClick: (note: string) => void;
  tuning: string;
  isTuningMode?: boolean;
  isTuningActive?: boolean;
  memoryStatus?: 'perfect' | 'sharp' | 'flat' | null;
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
       className={`kalimba-key ${isFirst ? 'first-key' : ''} ${isLast ? 'last-key' : ''} ${isActive ? 'active' : ''} ${isTuningActive ? 'tuning-focus' : ''} ${!isTuningActive && isTuningMode && memoryStatus ? `memorized-${memoryStatus}` : ''} ${status ? `tune-${status}` : ''}`}
       data-note={keyData.note}
       onClick={() => onNoteClick(getTunedNote(keyData.note, tuning))}
    >
      {isTuningMode && isTuningActive && status && (
        <div className={`tuning-indicator status-${status}`}>
          {status === 'flat' && <ArrowUp size={20} strokeWidth={3} />}
          {status === 'sharp' && <ArrowDown size={20} strokeWidth={3} />}
          {status === 'perfect' && <Circle size={14} fill="white" strokeWidth={0} />}
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
});
KalimbaKey.displayName = 'KalimbaKey';

export const Kalimba: React.FC<KalimbaProps> = ({ 
  ppi, 
  activeNotes, 
  onNoteClick,
  showNumbers,
  tuning,
  isTuningMode,
  selectedTuningKey,
  currentTuningCents,
  tuningMemory
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

          const tunedNote = getTunedNote(keyData.note, tuning);
          const isTuningActive = isTuningMode && selectedTuningKey === tunedNote;
          const memoryStatus = tuningMemory?.[tunedNote] || null;
          
          return (
            <KalimbaKey 
              key={keyData.note}
              keyData={keyData}
              isFirst={isFirst}
              isLast={isLast}
              isActive={isActive}
              showNumbers={showNumbers}
              onNoteClick={onNoteClick}
              tuning={tuning}
              isTuningMode={isTuningMode}
              isTuningActive={isTuningActive}
              memoryStatus={memoryStatus}
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
