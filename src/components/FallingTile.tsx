import React from 'react';
import './FallingTile.css';

interface FallingTileProps {
  note: string;
  duration?: number; // Time it takes to reach the bottom in ms
  isPlaying: boolean;
}

export const FallingTile: React.FC<FallingTileProps> = ({ note, duration = 2000, isPlaying }) => {
  return (
    <div 
      className="falling-tile" 
      data-key-note={note}
      style={{ 
        animationDuration: `${duration}ms`,
        animationPlayState: isPlaying ? 'running' : 'paused'
      }}
    >
      <div className="tile-glow"></div>
    </div>
  );
};
