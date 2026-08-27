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
  const [isFinished, setIsFinished] = useState(false);
  const [tempo, setTempo] = useState(50);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
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
    
    let rafId: number;
    const updateProgress = () => {
      if (playerRef.current) {
        // midiplayer.getSongPercentRemaining() natively uses Math.round() which destroys 
        // sub-percent precision and causes the slider to visibly jump in ~1% chunks.
        // We must calculate the raw float percentage manually by observing the mechanical ticks directly!
        const currentTick = playerRef.current.getCurrentTick();
        const total = playerRef.current.totalTicks;
        
        if (total > 0) {
          let current = (currentTick / total) * 100;
          current = Math.max(0, Math.min(100, current));
          setProgress(current);
        }
      }
      rafId = requestAnimationFrame(updateProgress);
    };
    
    rafId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(rafId);
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

    playerRef.current.on('endOfFile', () => {
      // The MIDI player has reached the final tick. Wait precisely 2300ms for 
      // the absolutely final visual tile spawned to successfully physically hit the kalimba tines!
      setTimeout(() => {
        setIsPlaying(false);
        setIsFinished(true);
        setProgress(100);
      }, 2300);
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
      
      // 1. Add to falling notes animation queue immediately (takes precisely 2000ms to reach bridge)
      setFallingNotes(prev => [...prev, { id: noteId, note: cleanNote, isHit: false }]);
      
      // 2. Play sound AND trigger active key strike glow at exact impact time (2000ms)
      scheduleTask(`${noteId}-play`, 2000, () => {
        if (instrumentRef.current && acRef.current) {
          if (acRef.current.state === 'suspended') acRef.current.resume();
          instrumentRef.current.play(event.noteName, acRef.current.currentTime, {
            gain: event.velocity / 100,
          });
        }

        setActiveNotes(prev => {
          if (!prev.includes(cleanNote)) return [...prev, cleanNote];
          return prev;
        });
      });

      // 3. Clear active key strike highlight after 180ms
      scheduleTask(`${noteId}-off`, 2000 + 180, () => {
        setActiveNotes(prev => prev.filter(n => n !== cleanNote));
      });

      // 4. Safe Garbage Collection: remove visual note from array at 2300ms (after gliding below)
      scheduleTask(`${noteId}-cleanup`, 2300, () => {
        setFallingNotes(prev => prev.filter(n => n.id !== noteId));
      });
    }

    if (event.name === "Note off" || (event.name === "Note on" && event.velocity === 0)) {
      // Handled cleanly by the scheduled note release above
    }
  };

  const play = () => {
    isIntentionallyPaused.current = false;
    if (playerRef.current) {
      if (acRef.current && acRef.current.state === 'suspended') {
        acRef.current.resume();
      }

      // If song was finished, always restart cleanly from the top
      if (isFinished) {
        setIsFinished(false);
        setProgress(0);
        setActiveNotes([]);
        setFallingNotes([]);
        clearTasks();
        if (instrumentRef.current) instrumentRef.current.stop();
        playerRef.current.skipToPercent(0);
        setIsPlaying(true);
        setTimeout(() => { playerRef.current.play(); }, 100);
        return;
      }

      const isResuming = playerRef.current.getCurrentTick() > 0 && !isPlaying;
      if (isResuming) {
        resumeTasks();
        playerRef.current.play();
      } else {
        clearTasks();
        if (instrumentRef.current) instrumentRef.current.stop();
        setTimeout(() => {
          playerRef.current.play();
        }, 100);
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
      if (instrumentRef.current) {
        instrumentRef.current.stop();
      }
    }
  };

  const stop = () => {
    isIntentionallyPaused.current = true;
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      setIsFinished(false);
      setProgress(0);
      setActiveNotes([]);
      setFallingNotes([]);
      clearTasks();
      if (acRef.current && acRef.current.state === 'suspended') {
        acRef.current.resume();
      }
      if (instrumentRef.current) {
        instrumentRef.current.stop();
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
    isFinished,
    tempo,
    progress,
    activeNotes,
    fallingNotes,
    initPlayer,
    play,
    pause,
    stop,
    seek,
    setTempo: setGlobalTempo,
    playDirectNote
  };
}
