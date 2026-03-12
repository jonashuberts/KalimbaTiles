import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Kalimba } from './Kalimba';
import { KALIMBA_KEYS } from '../constants/kalimba';
import { FallingTile } from './FallingTile';
import { useMidiPlayer } from '../hooks/useMidiPlayer';
import './Layout.css';

export const Layout: React.FC = () => {
  // Global Settings State
  const [ppi, setPpi] = useState<number>(153);
  const [showNumbers, setShowNumbers] = useState(true);

  // Hook into MIDI Engine
  const {
    isReady,
    isPlaying,
    tempo,
    activeNotes,
    fallingNotes,
    initPlayer,
    play,
    pause,
    stop,
    reset,
    setTempo,
    playDirectNote
  } = useMidiPlayer();

  // Handle File Upload from Local System
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && e.target.result instanceof ArrayBuffer) {
        initPlayer(e.target.result);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Auto-load MIDI from URL parameter (e.g., ?midi=sample.mid)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const midiUrl = params.get('midi');
    if (midiUrl) {
      fetch(midiUrl)
        .then(response => response.arrayBuffer())
        .then(buffer => {
          initPlayer(buffer);
        })
        .catch(err => console.error("Failed to load MIDI from URL:", err));
    }
  }, [initPlayer]);

  return (
    <div className="layout-container">
      {/* Dynamic Background Elements */}
      <div className="bg-glow bg-top"></div>
      <div className="bg-glow bg-bottom"></div>

      <Navbar 
        ppi={ppi} 
        setPpi={setPpi}
        tempo={tempo}
        setTempo={setTempo}
        onFileUpload={handleFileUpload}
        onPlay={isPlaying ? pause : play}
        onStop={stop}
        onReset={reset}
        isPlaying={isPlaying}
        isReady={isReady}
        showNumbers={showNumbers}
        setShowNumbers={setShowNumbers}
      />

      <main className="main-content">
        {/* Falling Note Animation Layer */}
        <div className="animation-container">
          <div className="falling-tiles-wrapper">
             {/* We create 17 invisible flex columns mathematically matching the keys. */}
             {KALIMBA_KEYS.map((keyData: { note: string; label: string; octave: string }) => {
               // Filter events meant for this specific key pipeline
               const activeTilesForThisKey = fallingNotes.filter(n => n.note === keyData.note);
               
               return (
                 <div key={`col-${keyData.note}`} className="falling-col">
                   {activeTilesForThisKey.map(noteEvent => (
                     <FallingTile
                        key={noteEvent.id}
                        note={noteEvent.note}
                        duration={2000}
                        isPlaying={isPlaying}
                     />
                   ))}
                 </div>
               );
             })}
          </div>
        </div>

        {/* Physical Interactive Kalimba Layer */}
        <Kalimba 
          ppi={ppi} 
          activeNotes={activeNotes}
          fallingNotes={fallingNotes}
          isPlaying={isPlaying}
          onNoteClick={playDirectNote}
          showNumbers={showNumbers}
        />
      </main>
    </div>
  );
};
