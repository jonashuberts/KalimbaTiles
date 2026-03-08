import { useState, useEffect, useRef } from 'react';

// Declare globals that are loaded via public/index.html script tags
declare global {
  interface Window {
    MidiPlayer: any;
    Soundfont: any;
    AudioContext: any;
    webkitAudioContext: any;
  }
}

export function useMidiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [tempo, setTempo] = useState(50);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  // We track "falling" notes separately so they trigger animations exactly when parsed
  const [fallingNotes, setFallingNotes] = useState<{ id: string; note: string }[]>([]);

  const playerRef = useRef<any>(null);
  const instrumentRef = useRef<any>(null);
  const acRef = useRef<any>(null);
  
  // To avoid duplicate sound events, we track a flag
  const tempoInitialized = useRef(false);

  useEffect(() => {
    // Initialize AudioContext and Soundfont on mount
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      acRef.current = new AudioCtx();
      if (window.Soundfont) {
        window.Soundfont.instrument(acRef.current, 'kalimba').then((inst: any) => {
          instrumentRef.current = inst;
          console.log("Soundfont loaded!");
        });
      }
    }
  }, []);

  const initPlayer = (arrayBuffer: ArrayBuffer) => {
    if (!window.MidiPlayer) {
      console.error("MidiPlayer library not found.");
      return;
    }

    if (playerRef.current) {
      playerRef.current.stop();
    }

    tempoInitialized.current = false;

    playerRef.current = new window.MidiPlayer.Player((event: any) => {
      handleMidiEvent(event);
    });

    playerRef.current.loadArrayBuffer(arrayBuffer);
    setTempo(playerRef.current.tempo || 50);
    setIsReady(true);
  };

  const handleMidiEvent = (event: any) => {
    if (!tempoInitialized.current && playerRef.current) {
      setTempo(playerRef.current.tempo);
      tempoInitialized.current = true;
    }
    
    // Safety check for user-adjusted tempo overrides
    if (playerRef.current && (tempo !== playerRef.current.tempo)) {
       // Ideally we sync here if the user changed it in the UI, we handle that in setGlobalTempo
    }

    if (event.name === "Note on" && event.velocity > 0) {
      const cleanNote = event.noteName.replace(/C-1/gi, "NO");
      const noteId = `${Date.now()}-${Math.random()}`;
      
      // 1. Add to falling notes animation queue immediately
      setFallingNotes(prev => [...prev, { id: noteId, note: cleanNote }]);
      
      // 2. Play the sound & light up key AFTER the animation duration (2000ms)
      setTimeout(() => {
        if (instrumentRef.current && acRef.current) {
          instrumentRef.current.play(event.noteName, acRef.current.currentTime, {
            gain: event.velocity / 100,
          });
        }
        
        setActiveNotes(prev => {
          if (!prev.includes(cleanNote)) return [...prev, cleanNote];
          return prev;
        });

        // 3. Remove from animation queue so they despawn cleanly
        setFallingNotes(prev => prev.filter(n => n.id !== noteId));
      }, 2000);
    }

    if (event.name === "Note off" || (event.name === "Note on" && event.velocity === 0)) {
      const cleanNote = event.noteName.replace(/C-1/gi, "NO");
      setTimeout(() => {
        setActiveNotes(prev => prev.filter(n => n !== cleanNote));
      }, 2000 + 150); // Slight delay to ensure the visual key press flashes adequately
    }
  };

  const play = () => {
    if (playerRef.current) {
      // Small artificial delay matched from legacy code to allow tiles to start rendering
      setTimeout(() => {
        playerRef.current.play();
      }, 1000); 
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      setActiveNotes([]);
      setFallingNotes([]);
    }
  };

  const reset = () => {
    setActiveNotes([]);
    setFallingNotes([]);
  };

  const setGlobalTempo = (newTempo: number) => {
    setTempo(newTempo);
    if (playerRef.current) {
      playerRef.current.setTempo(newTempo);
    }
  };

  const playDirectNote = (note: string) => {
    if (instrumentRef.current && acRef.current) {
      if (acRef.current.state === 'suspended') {
          acRef.current.resume();
      }
      // Note mapping edge cases preserved from legacy
      const mapped = note.replace(/C-1/gi, 'C4');
      instrumentRef.current.play(mapped);
    }
  };

  return {
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
    setTempo: setGlobalTempo,
    playDirectNote
  };
}
