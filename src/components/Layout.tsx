import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Kalimba } from './Kalimba';
import { parseNote, isAccidental, getFrequencyFromNote, getCentsOffPitch } from '../constants/kalimba';
import { KALIMBA_KEYS } from '../constants/kalimba';
import { FallingTile } from './FallingTile';
import { useMidiPlayer } from '../hooks/useMidiPlayer';
import { usePitchDetection } from '../hooks/usePitchDetection';
import packageJson from '../../package.json';
import './Layout.css';

export const Layout: React.FC = () => {
  // Global Settings State
  const [ppi, setPpi] = useState<number>(() => {
    const savedScale = localStorage.getItem('kalimbaScale');
    return savedScale ? Number(savedScale) : 153;
  });
  const [showNumbers, setShowNumbers] = useState(true);
  const [tuning, setTuning] = useState<string>(() => {
    return localStorage.getItem('kalimbaTuning') || 'C Major';
  });

  // Tuning Mode State
  const [isTuningMode, setIsTuningMode] = useState(false);
  const [selectedTuningKey, setSelectedTuningKey] = useState<string | null>(null);
  
  // Maps dynamically verified perfect key tunings to persistent board visual logic
  const [tuningMemory, setTuningMemory] = useState<Record<string, boolean>>({});

  // Hook into Hardware Audio
  const { pitch, error: micError, startListening, stopListening } = usePitchDetection();

  // Persist settings to localStorage
  React.useEffect(() => {
    localStorage.setItem('kalimbaScale', ppi.toString());
  }, [ppi]);

  React.useEffect(() => {
    localStorage.setItem('kalimbaTuning', tuning);
  }, [tuning]);

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
    setTempo,
    playDirectNote,
    progress,
    seek
  } = useMidiPlayer();

  const handleToggleTuningMode = async () => {
    if (isTuningMode) {
      setIsTuningMode(false);
      setSelectedTuningKey(null);
      stopListening();
    } else {
      stop(); // Mathematically eradicate playback before entering tuning
      await startListening();
      setIsTuningMode(true);
    }
  };

  const handleNoteClick = (note: string) => {
    if (isTuningMode) {
      setSelectedTuningKey(note);
      playDirectNote(note); // Output the correct tuned tone exactly so user can tune by ear
    } else {
      playDirectNote(note);
    }
  };

  // Processing Math
  let renderTuningCents: number | null = null;
  if (isTuningMode && selectedTuningKey && pitch) {
    const exactFrequency = getFrequencyFromNote(selectedTuningKey);
    if (exactFrequency) {
      let diff = getCentsOffPitch(pitch, exactFrequency);
      
      // Overtone Tolerance: Kalimba metal tines produce extremely heavy harmonic overtones.
      // Phone microphones using Math Autocorrelation regularly lock onto the 1st or 2nd harmonic (octaves).
      // We physically fold the cent difference modulo 1200 (1 Octave = 1200 cents) to 
      // extract purely the chromatic tuning offset regardless of the octave detected!
      diff = diff % 1200;
      if (diff > 600) diff -= 1200;
      if (diff < -600) diff += 1200;

      // Relax the tolerance slightly. A kalimba can easily be 3 semitones out of tune on an abused tine.
      if (Math.abs(diff) < 400) {
        renderTuningCents = diff;

        // Dispatch tuning memory state mutations
        if (Math.abs(diff) <= 10) {
           if (!tuningMemory[selectedTuningKey]) {
               // Update memory! Wait, we shouldn't infinitely loop or mutate state directly during render body.
               // We will push this to a React useEffect below relying on selectedTuningKey and renderTuningCents.
           }
        }
      }
    }
  }

  // React strictly updates persistent tuning memory when active metrics cross the mathematically verified thresholds
  React.useEffect(() => {
    if (isTuningMode && selectedTuningKey && renderTuningCents !== null) {
      if (Math.abs(renderTuningCents) <= 10) {
        setTuningMemory(prev => prev[selectedTuningKey] ? prev : { ...prev, [selectedTuningKey]: true });
      } else {
        setTuningMemory(prev => !prev[selectedTuningKey] ? prev : { ...prev, [selectedTuningKey]: false });
      }
    }
  }, [isTuningMode, selectedTuningKey, renderTuningCents]);

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
      play(); 
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
      {micError && (
        <div className="tuning-error-banner">
          {micError} Ensure microphone permissions are granted.
        </div>
      )}
      
      {isTuningMode && !selectedTuningKey && !micError && (
        <div className="tuning-instruction-banner">
          Tap a Kalimba key to start tuning it!
        </div>
      )}

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
        isPlaying={isPlaying}
        isReady={isReady}
        showNumbers={showNumbers}
        setShowNumbers={setShowNumbers}
        tuning={tuning}
        setTuning={setTuning}
        progress={progress}
        seek={seek}
        isTuningMode={isTuningMode}
        toggleTuningMode={handleToggleTuningMode}
      />

      <main className="main-content">
        {/* Falling Note Animation Layer */}
        {!isTuningMode && (
          <div className="animation-container">
            <div className="falling-tiles-wrapper">
               {KALIMBA_KEYS.map((keyData: { note: string; label: string; octave: string }) => {
                 const activeTilesForThisKey = fallingNotes.filter(n => {
                   const parsed = parseNote(n.note);
                   if (!parsed) return n.note === keyData.note; 
                   return `${parsed.letter}${parsed.octave}` === keyData.note;
                 });
                 
                 return (
                   <div key={`col-${keyData.note}`} className="falling-col">
                     {activeTilesForThisKey.map(noteEvent => {
                       const isHalf = isAccidental(noteEvent.note, tuning);
                       return (
                         <FallingTile
                            key={noteEvent.id}
                            note={noteEvent.note}
                            duration={2300}
                            isPlaying={isPlaying}
                            isHalfNote={isHalf}
                         />
                       );
                     })}
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* Physical Interactive Kalimba Layer */}
        <Kalimba 
          ppi={ppi} 
          activeNotes={activeNotes}
          fallingNotes={!isTuningMode ? fallingNotes : []}
          isPlaying={isPlaying}
          onNoteClick={handleNoteClick}
          showNumbers={showNumbers}
          tuning={tuning}
          isTuningMode={isTuningMode}
          selectedTuningKey={selectedTuningKey}
          currentTuningCents={renderTuningCents}
          tuningMemory={tuningMemory}
        />
      </main>

      {/* Global Version Watermark */}
      <div className="version-watermark">
        v{packageJson.version}
      </div>
    </div>
  );
};
