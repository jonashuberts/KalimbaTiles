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
  const isIntentionallyPaused = useRef(true);
  const userTempoOverride = useRef<number | null>(null);
  
  type PendingTask = {
    id: string;
    startTime: number;
    remainingTime: number;
    callback: () => void;
    timerId?: ReturnType<typeof setTimeout>;
  };
  const pendingTasks = useRef<Map<string, PendingTask>>(new Map());
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
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      acRef.current = new AudioCtx();
      if (window.Soundfont) {
        window.Soundfont.instrument(acRef.current, 'kalimba').then((inst: any) => {
          instrumentRef.current = inst;
          console.log("Soundfont loaded!");
        });
      }

      const unlockAudioContext = () => {
        if (isIntentionallyPaused.current) return;
        if (acRef.current && acRef.current.state === 'suspended') {
          acRef.current.resume();
        }
      };

      document.addEventListener('touchstart', unlockAudioContext, { passive: true });
      document.addEventListener('click', unlockAudioContext, { passive: true });

      return () => {
        document.removeEventListener('touchstart', unlockAudioContext);
        document.removeEventListener('click', unlockAudioContext);
      };
    }
  }, []);

  const initPlayer = (arrayBuffer: ArrayBuffer) => {
    if (!window.MidiPlayer) {
      console.error("MidiPlayer library not found.");
      return;
    }

    stop();
    tempoInitialized.current = false;
    userTempoOverride.current = null;

    playerRef.current = new window.MidiPlayer.Player((event: any) => {
      handleMidiEvent(event);
    });

    playerRef.current.on('endOfFile', () => {
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
      
      // 1. Render falling note immediately
      setFallingNotes(prev => [...prev, { id: noteId, note: cleanNote, isHit: false }]);
      
      // 2. Hardware Audio Clock: Schedule exact 2000ms future playback directly in WebAudio thread
      if (instrumentRef.current && acRef.current) {
        if (acRef.current.state === 'suspended') acRef.current.resume();
        const preciseHitTime = acRef.current.currentTime + 2.0; 
        
        instrumentRef.current.play(event.noteName, preciseHitTime, {
          gain: event.velocity / 100,
        });
      }

      // 3. Highlight key at 2000ms strike
      scheduleTask(`${noteId}-play`, 2000, () => {
        setActiveNotes(prev => {
          if (!prev.includes(cleanNote)) return [...prev, cleanNote];
          return prev;
        });
      });

      // 4. Deactivate key highlight after 200ms
      scheduleTask(`${noteId}-off`, 2200, () => {
        setActiveNotes(prev => prev.filter(n => n !== cleanNote));
      });

      // 5. Clean up note from state at 2300ms
      scheduleTask(`${noteId}-cleanup`, 2300, () => {
        setFallingNotes(prev => prev.filter(n => n.id !== noteId));
      });
    }
  };

  const play = () => {
    isIntentionallyPaused.current = false;
    if (playerRef.current) {
      if (acRef.current && acRef.current.state === 'suspended') {
        acRef.current.resume();
      }

      if (isFinished) {
        setIsFinished(false);
        setProgress(0);
        setActiveNotes([]);
        setFallingNotes([]);
        clearTasks();
        if (instrumentRef.current) instrumentRef.current.stop();
        playerRef.current.skipToPercent(0);
        setIsPlaying(true);
        setTimeout(() => { playerRef.current.play(); }, 300);
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
    
    setProgress(percent);
    const wasPlaying = !isIntentionallyPaused.current && isPlaying;
    
    if (wasPlaying) {
      playerRef.current.pause();
    }
    
    setActiveNotes([]);
    setFallingNotes([]);
    clearTasks();
    if (instrumentRef.current && instrumentRef.current.stop) {
      instrumentRef.current.stop();
    }

    try {
      playerRef.current.skipToPercent(percent);
    } catch (e) {
      console.error("Seek error in MidiPlayer:", e);
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
