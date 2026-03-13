import React from 'react';
import { Play, Square, RotateCcw, FileMusic, Settings, Minus, Plus } from 'lucide-react';
import packageJson from '../../package.json';
import './Navbar.css';

interface NavbarProps {
  ppi: number;
  setPpi: (val: number) => void;
  tempo: number;
  setTempo: (val: number) => void;
  onFileUpload: (file: File) => void;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isReady: boolean;
  showNumbers: boolean;
  setShowNumbers: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  ppi,
  setPpi,
  tempo,
  setTempo,
  onFileUpload,
  onPlay,
  onStop,
  onReset,
  isPlaying,
  isReady,
  showNumbers,
  setShowNumbers
}) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>KalimbaTiles <span className="version-badge">v{packageJson.version}</span></h1>
      </div>

      <div className="nav-controls">
        <label className="file-upload-btn">
          <FileMusic size={18} />
          <span>Select MIDI</span>
          <input 
            type="file" 
            accept=".mid" 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
              }
            }} 
            hidden
          />
        </label>

        <div className="playback-controls">
          <button 
            className={`btn-icon ${isPlaying ? 'active' : ''}`} 
            onClick={onPlay} 
            disabled={!isReady}
            title={isPlaying ? "Pause" : "Play"}
          >
            <Play size={20} fill={isPlaying ? "currentColor" : "none"} />
          </button>
          <button className="btn-icon" onClick={onStop} disabled={!isReady} title="Stop">
            <Square size={20} />
          </button>
          <button className="btn-icon danger" onClick={onReset} title="Reset">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="setting-group">
          <span className="setting-label">Tempo</span>
          <input 
            type="number" 
            className="tempo-input" 
            min={10} 
            max={200} 
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            disabled={!isReady}
          />
        </div>

        <div className="scale-selector">
          <span className="setting-label">Scale</span>
          <div className="control-group">
            <button 
              className="control-btn" 
              onClick={() => setPpi(Math.max(50, ppi - 1))}
              title="Decrease Scale"
            >
              <Minus size={16} />
            </button>
            <span className="scale-value">{ppi}</span>
            <button 
              className="control-btn" 
              onClick={() => setPpi(Math.min(250, ppi + 1))}
              title="Increase Scale"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="control-group">
          <button 
            className={`btn-icon toggle-btn ${showNumbers ? 'active' : ''}`}
            onClick={() => setShowNumbers(!showNumbers)}
            title="Toggle Numbers"
          >
            <Settings size={20} />
            <span className="toggle-text">123</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
