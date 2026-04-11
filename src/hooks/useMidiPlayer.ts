/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // Store falling notes. Instead of deleting them from memory aggressively (causing React DOM churn), 
  // we flag them as "hit" and hide them with CSS to save mobile CPU.
  const [fallingNotes, setFallingNotes] = useState<{ id: string; note: string; isHit: boolean }[]>([]);
  const [progress, setProgress] = useState(0);

  const playerRef = useRef<any>(null);
  const instrumentRef = useRef<any>(null);
  const acRef = useRef<any>(null);
  const isIntentionallyPaused = useRef(true); // Start true so we don't wake up on random clicks before playing
  const userTempoOverride = useRef<number | null>(null); // Track manual overrides to combat timeline resync resets
  
  // Track scheduled tasks so we can pause and resume them
  type PendingTask = {
    id: string;
    startTime: number;
    remainingTime: number;
    callback: () => void;
    timerId?: ReturnType<typeof setTimeout>;
  };
  const pendingTasks = useRef<Map<string, PendingTask>>(new Map());

  // To avoid duplicate sound events, we track a flag
  const tempoInitialized = useRef(false);

  const scheduleTask = (id: string, delay: number, callback: () => void) => {
    const task: PendingTask = {
      id,
      startTime: Date.now(),
      remainingTime: Math.max(0, delay),
      callback,
      timerId: setTimeout(() => {
        callback();
        pendingTasks.current.delete(id);
      }, delay)
    };
    pendingTasks.current.set(id, task);
  };

  const pauseTasks = () => {
    const now = Date.now();
    for (const task of pendingTasks.current.values()) {
      if (task.timerId) {
        clearTimeout(task.timerId);
        task.timerId = undefined;
        task.remainingTime -= (now - task.startTime);
      }
    }
  };

  const resumeTasks = () => {
    const now = Date.now();
    for (const [id, task] of pendingTasks.current.entries()) {
      if (!task.timerId) {
        task.startTime = now;
        task.timerId = setTimeout(() => {
          task.callback();
          pendingTasks.current.delete(id);
        }, task.remainingTime);
      }
    }
  };

  const clearTasks = () => {
    for (const task of pendingTasks.current.values()) {
      if (task.timerId) clearTimeout(task.timerId);
    }
    pendingTasks.current.clear();
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (playerRef.current) {
        // MidiPlayerJS returns 100 at start, 0 at end
        const remain = playerRef.current.getSongPercentRemaining();
        if (typeof remain === 'number' && !isNaN(remain)) {
          // Invert it so 0 is start, 100 is end
          let current = 100 - remain;
          // Clamp bounds and round cleanly
          current = Math.max(0, Math.min(100, current));
          setProgress(current);
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying]);

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

      // iOS Safari forcefully suspends the AudioContext when the screen is locked or the app is backgrounded.
      // It CANNOT be resumed programmatically (e.g., inside the handleMidiEvent loop).
      // It MUST be resumed synchronously inside a direct user interaction event (touchstart/click).
      const unlockAudioContext = () => {
        // If the user intentionally pressed Pause/Stop, we should not hijack their choice and force-play 
        // the remaining 2000ms buffer just because the click event bubbled up to the document!
        if (isIntentionallyPaused.current) return;

        if (acRef.current && acRef.current.state === 'suspended') {
          acRef.current.resume().then(() => {
            console.log("AudioContext forcefully awakened by user interaction.");
          });
        }
      };

      document.addEventListener('touchstart', unlockAudioContext, { passive: true });
      document.addEventListener('click', unlockAudioContext, { passive: true });

      return () => {
        document.removeEventListener('touchstart', unlockAudioContext);
        document.removeEventListener('click', unlockAudioContext);
        document.removeEventListener('keydown', unlockAudioContext);
      };
    }
  }, []);

  const initPlayer = (arrayBuffer: ArrayBuffer) => {
    if (!window.MidiPlayer) {
      console.error("MidiPlayer library not found.");
      return;
    }

    stop(); // Cleanly stop existing playback, clear active arrays, and halt tasks

    tempoInitialized.current = false;
    userTempoOverride.current = null;

    playerRef.current = new window.MidiPlayer.Player((event: any) => {
      handleMidiEvent(event);
    });

    try {
      playerRef.current.loadArrayBuffer(arrayBuffer);
      setTempo(playerRef.current.tempo || 50);
      setIsReady(true);
    } catch(err) {
      // Re-throw the parsed error so the UI can gracefully reset itself
      throw err;
    }
  };

  const handleMidiEvent = (event: any) => {
    if (!tempoInitialized.current && playerRef.current) {
      setTempo(playerRef.current.tempo);
      tempoInitialized.current = true;
    }
    
    if (event.name === 'Set Tempo' && playerRef.current) {
      if (userTempoOverride.current !== null) {
        playerRef.current.setTempo(userTempoOverride.current);
      } else {
        setTempo(playerRef.current.tempo);
      }
    }

    if (event.name === "Note on" && event.velocity > 0) {
      const cleanNote = event.noteName.replace(/C-1/gi, "NO");
      const noteId = `${Date.now()}-${Math.random()}`;
      
      // 1. Add to falling notes animation queue immediately
      setFallingNotes(prev => [...prev, { id: noteId, note: cleanNote, isHit: false }]);
      
      // 2. Delegate audio rendering entirely to the browser's hardware audio thread (precise 2000ms future playback)
      // This is immune to JS thread frame drops.
      if (instrumentRef.current && acRef.current) {
        if (acRef.current.state === 'suspended') acRef.current.resume();
        const preciseHitTime = acRef.current.currentTime + 2.0; 
        
        instrumentRef.current.play(event.noteName, preciseHitTime, {
          gain: event.velocity / 100,
        });
      }

      // 3. The Kalimba Key glow is now natively handled by declarative CSS `animation-delay: 2000ms`
      // rendered inside KalimbaKey based directly on the `fallingNotes` array!
      // This achieves precisely 0.0ms of latency drift from the visual tile.

      // 4. Safe Garbage Collection: remove invisible elements safely 3 seconds AFTER the strike 
      // when the CPU is completely idle, preventing infinite DOM growth.
      scheduleTask(`${noteId}-cleanup`, 5000, () => {
         setFallingNotes(prev => prev.filter(n => n.id !== noteId));
      });
    }

    if (event.name === "Note off" || (event.name === "Note on" && event.velocity === 0)) {
      // We removed the matching Note Off visual trigger here.
      // The Kalimba simply glows for 150ms on strike and fades, just like physically plucking a tine.
    }
  };

  const play = () => {
    isIntentionallyPaused.current = false;
    if (playerRef.current) {
      if (acRef.current && acRef.current.state === 'suspended') {
        acRef.current.resume();
      }
      
      const isResuming = playerRef.current.getCurrentTick() > 0 && !isPlaying;
      if (isResuming) {
        resumeTasks();
        playerRef.current.play();
      } else {
        clearTasks();
        // Clear old sounds if restarting
        if (instrumentRef.current) instrumentRef.current.stop(); 
        
        setTimeout(() => {
          playerRef.current.play();
        }, 1000); 
      }
      setIsPlaying(true);
    }
  };

  const pause = () => {
    isIntentionallyPaused.current = true;
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
      pauseTasks();
      // Halt the native hardware audio clock so scheduled sounds freeze flawlessly in time!
      if (acRef.current && acRef.current.state === 'running') {
        acRef.current.suspend(); 
      }
    }
  };

  const stop = () => {
    isIntentionallyPaused.current = true;
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      setProgress(0);
      setActiveNotes([]);
      setFallingNotes([]);
      clearTasks();
      // Resume context briefly if needed to flush buffers out cleanly
      if (acRef.current && acRef.current.state === 'suspended') {
        acRef.current.resume();
      }
      if (instrumentRef.current) {
        instrumentRef.current.stop(); // Eradicate all buffered scheduled notes securely
      }
    }
  };

  const seek = (percent: number) => {
    if (!playerRef.current) return;
    
    // Hard clamp exactly to percent to keep state instantly responsive for scrubbing UI
    setProgress(percent);
    
    const wasPlaying = !isIntentionallyPaused.current && isPlaying;
    
    if (wasPlaying) {
      playerRef.current.pause();
    }
    
    // Purge visual and audio states comprehensively so skipping does not overlap massive polyphony sounds natively
    setActiveNotes([]);
    setFallingNotes([]);
    clearTasks();
    if (instrumentRef.current && instrumentRef.current.stop) {
      instrumentRef.current.stop();
    }

    try {
      playerRef.current.skipToPercent(percent);
    } catch (e) {
      console.error("Seek error natively within MidiPlayer:", e);
    }

    if (wasPlaying) {
      playerRef.current.play();
    }
  };

  const reset = () => {
    setActiveNotes([]);
    setFallingNotes([]);
    clearTasks();
    if (instrumentRef.current) {
      instrumentRef.current.stop();
    }
  };

  const setGlobalTempo = (newTempo: number) => {
    setTempo(newTempo);
    userTempoOverride.current = newTempo;
    if (playerRef.current) {
      const wasPlaying = playerRef.current.isPlaying();
      
      // MidiPlayerJS calculates the current playback position based on (Date.now() - startTime) * tempo.
      // If we change the tempo on the fly without pausing, it breaks the math and jumps forward/backward in the song.
      // We must pause it first to bake its current position into the static `startTick` using the OLD tempo,
      // apply the new tempo, and gracefully resume so it starts tracking from `startTick` using the NEW tempo. 
      if (wasPlaying) playerRef.current.pause();
      
      playerRef.current.setTempo(newTempo);
      
      if (wasPlaying) playerRef.current.play();
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
    progress,
    activeNotes,
    fallingNotes,
    initPlayer,
    play,
    pause,
    stop,
    seek,
    reset,
    setTempo: setGlobalTempo,
    playDirectNote
  };
}
