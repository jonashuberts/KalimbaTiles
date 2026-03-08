import React, { useEffect, useState } from 'react';
import './FallingTile.css';

interface FallingTileProps {
  note: string;
  duration?: number; // Time it takes to reach the bottom in ms
  onHit: (note: string) => void;
}

export const FallingTile: React.FC<FallingTileProps> = ({ note, duration = 2000, onHit }) => {
  const [isHit, setIsHit] = useState(false);

  useEffect(() => {
    // The tile drops. When the animation duration ends, it "hits" the key.
    const timer = setTimeout(() => {
      setIsHit(true);
      onHit(note);
    }, duration);

    return () => clearTimeout(timer);
  }, [note, duration, onHit]);

  // If the tile has hit, we remove it from rendering entirely 
  // (the parent typically manages this via active note lists, but this provides a fallback)
  if (isHit) return null;

  return (
    <div 
      className="falling-tile" 
      data-key-note={note}
      style={{ animationDuration: `${duration}ms` }}
    >
      <div className="tile-glow"></div>
    </div>
  );
};
