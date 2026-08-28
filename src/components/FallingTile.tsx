import React from 'react';
import './FallingTile.css';

interface FallingTileProps {
  note: string;
  duration?: number; // Time it takes to reach the key in ms (default 2000ms)
  isPlaying: boolean;
  isHalfNote?: boolean;
}

export const FallingTile = React.memo(({ note, duration = 2000, isPlaying, isHalfNote }: FallingTileProps) => {
  return (
    <div 
      className="falling-tile-wrapper" 
      data-key-note={note}
      style={{ 
        animationDuration: `${duration}ms`,
        animationPlayState: isPlaying ? 'running' : 'paused'
      }}
    >
      <div 
        className={`falling-tile-visual ${isHalfNote ? 'half-note' : ''}`}
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
      >
        <div className="tile-glow"></div>
        {isHalfNote && (
          <span className="half-note-marker">
            {note.includes('#') ? '♯' : '♭'}
          </span>
        )}
      </div>
    </div>
  );
});
FallingTile.displayName = 'FallingTile';
