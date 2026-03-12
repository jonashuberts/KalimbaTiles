import React from 'react';
import './FallingTile.css';

interface FallingTileProps {
  note: string;
  duration?: number; // Time it takes to reach the bottom in ms
  isPlaying: boolean;
}

export const FallingTile = React.memo(({ note, duration = 2000, isPlaying }: FallingTileProps) => {
  return (
    <div 
      className="falling-tile-wrapper" 
      data-key-note={note}
      style={{ 
        animationDuration: `${duration}ms`,
        animationPlayState: isPlaying ? 'running' : 'paused'
      }}
    >
      <div className="falling-tile-visual">
        <div className="tile-glow"></div>
      </div>
    </div>
  );
});
FallingTile.displayName = 'FallingTile';
