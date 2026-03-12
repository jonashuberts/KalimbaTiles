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
      scheduleTask(`${noteId}-on`, 2000, () => {
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

        // 3. Remove from animation queue so they despawn cleanly
        setFallingNotes(prev => prev.filter(n => n.id !== noteId));
      });
    }

    if (event.name === "Note off" || (event.name === "Note on" && event.velocity === 0)) {
      const cleanNote = event.noteName.replace(/C-1/gi, "NO");
      scheduleTask(`off-${Date.now()}-${Math.random()}`, 2000 + 150, () => {
        setActiveNotes(prev => prev.filter(n => n !== cleanNote));
      });
    }
  };

  const play = () => {
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
        // Small artificial delay matched from legacy code to allow tiles to start rendering
        setTimeout(() => {
          playerRef.current.play();
        }, 1000); 
      }
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
      pauseTasks();
      if (instrumentRef.current) {
        instrumentRef.current.stop(); // Immediately mute active sounds on pause
      }
    }
  };

  const stop = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      setActiveNotes([]);
      setFallingNotes([]);
      clearTasks();
      if (instrumentRef.current) {
        instrumentRef.current.stop(); // Mute active sounds
      }
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
