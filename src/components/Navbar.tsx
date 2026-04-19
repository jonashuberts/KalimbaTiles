import React from 'react';
import { Play, Pause, Square, FileMusic, Settings, Minus, Plus, Mic } from 'lucide-react';
import { TUNINGS } from '../constants/kalimba';
import packageJson from '../../package.json';
import './Navbar.css';

interface NavbarProps {
  ppi: number;
  setPpi: (val: number) => void;
  tuning: string;
  setTuning: (val: string) => void;
  tempo: number;
  setTempo: (val: number) => void;
  onFileUpload: (file: File) => void;
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  isReady: boolean;
  showNumbers: boolean;
  setShowNumbers: (val: boolean) => void;
  progress: number;
  seek: (percent: number) => void;
  isTuningMode: boolean;
  toggleTuningMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  ppi,
  setPpi,
  tuning,
  setTuning,
  tempo,
  setTempo,
  onFileUpload,
  onPlay,
  onStop,
  isPlaying,
  isReady,
  showNumbers,
  setShowNumbers,
  progress,
  seek,
  isTuningMode,
  toggleTuningMode
}) => {
  const [localTempo, setLocalTempo] = React.useState<string>(tempo.toString());

  React.useEffect(() => {
    setLocalTempo(tempo.toString());
  }, [tempo]);

  const commitTempo = () => {
    const parsed = parseInt(localTempo, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTempo(parsed);
      setLocalTempo(parsed.toString()); // Clean up leading zeros
    } else {
      setLocalTempo(tempo.toString()); // Revert if invalid gracefully
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>KalimbaTiles</h1>
        <span className="version-badge mobile-visible-badge">v{packageJson.version}</span>
      </div>

      <div className="nav-controls">
        {/* Left Side: Environment Configuration */}
        <div className="nav-section">
          <div className="setting-group">
            <span className="setting-label">Tuning</span>
            <select 
              className="tempo-input tuning-select"
              value={tuning}
              onChange={(e) => setTuning(e.target.value)}
            >
              {Object.keys(TUNINGS).map(scale => (
                <option key={scale} value={scale}>{scale}</option>
              ))}
            </select>
          </div>

          <div className="scale-selector">
            <span className="setting-label">Zoom</span>
            <div className="control-group">
              <button 
                className="control-btn" 
                onClick={() => setPpi(Math.max(50, ppi - 1))}
                title="Decrease Zoom"
              >
                <Minus size={16} />
              </button>
              <span className="scale-value">{ppi}</span>
              <button 
                className="control-btn" 
                onClick={() => setPpi(Math.min(250, ppi + 1))}
                title="Increase Zoom"
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

        {/* Right Side: Tools & Playback */}
        <div className="nav-section">
          {!isTuningMode && (
            <>
              <label className="file-upload-btn">
                <FileMusic size={18} />
                <span>MIDI</span>
                <input 
                  type="file" 
                  accept=".mid,.midi,audio/midi,audio/x-midi" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onFileUpload(e.target.files[0]);
                    }
                  }} 
                  hidden
                />
              </label>

              <div className="setting-group tempo-group">
                <span className="setting-label">BPM</span>
                <input 
                  type={isReady ? "number" : "text"}
                  className="tempo-input" 
                  min={10} 
                  max={200} 
                  value={isReady ? localTempo : "---"}
                  onChange={(e) => setLocalTempo(e.target.value)}
                  onBlur={commitTempo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  disabled={!isReady}
                />
              </div>

              <div className="playback-controls">
                <button 
                  className={`btn-icon ${isPlaying ? 'active' : ''}`} 
                  onClick={onPlay} 
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="none" />}
                </button>
                <button className="btn-icon" onClick={onStop} disabled={!isReady} title="Stop">
                  <Square size={18} />
                </button>
              </div>
            </>
          )}

          <div className="control-group tuner-action-group">
            <button 
              className={`btn-icon toggle-btn ${isTuningMode ? 'active tune-mode-btn' : ''}`}
              onClick={toggleTuningMode}
              title="Tuner"
            >
              <Mic size={20} />
              <span className="toggle-text">Tune</span>
            </button>
          </div>
        </div>
      </div>

      {!isTuningMode && (
        <div className="progress-bar-container">
          <input 
            type="range" 
            className="progress-bar" 
            min="0" 
            max="100" 
            step="0.05"
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={!isReady}
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          />
        </div>
      )}
    </nav>
  );
};
