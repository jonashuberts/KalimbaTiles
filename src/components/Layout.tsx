import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Kalimba } from './Kalimba';
import { KALIMBA_KEYS } from '../constants/kalimba';
import { FallingTile } from './FallingTile';
import { useMidiPlayer } from '../hooks/useMidiPlayer';
import './Layout.css';

export const Layout: React.FC = () => {
  // Global Settings State
  const [ppi, setPpi] = useState<number>(() => {
    const savedScale = localStorage.getItem('kalimbaScale');
    return savedScale ? Number(savedScale) : 153;
  });
  const [showNumbers, setShowNumbers] = useState(true);

  // Persist scale setting to localStorage
  React.useEffect(() => {
    localStorage.setItem('kalimbaScale', ppi.toString());
  }, [ppi]);

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
        try {
          initPlayer(e.target.result);
        } catch(err: any) {
          console.error("Invalid MIDI file loaded:", err);
          alert("Error parsing MIDI file: " + err.message);
          pause();
        }
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

  const handlePlayClick = () => {
    if (!isReady) {
      // Calling play() synchronously flips the paused flag to false during the physical click event,
      // which allows the browser's audio policies to legally awaken the AudioContext immediately!
      play(); 
      
      // Load sample.mid and start playing automatically if no user file is ready
      fetch('/sample.mid')
        .then(res => {
           if (!res.ok) throw new Error("Could not fetch sample.mid");
           return res.arrayBuffer();
        })
        .then(buffer => {
          try {
            initPlayer(buffer);
            setTimeout(() => play(), 100);
          } catch(err: any) {
            console.error("Invalid default MIDI sample:", err);
            pause();
            alert("Error parsing default sample.mid: " + err.message);
          }
        })
        .catch(err => {
          console.error("Failed to fetch sample.mid", err);
          pause();
          alert("Failed to fetch default sample.md: " + err.message);
        });
    } else {
      isPlaying ? pause() : play();
    }
  };

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
        onPlay={handlePlayClick}
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
                        duration={2300}
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
