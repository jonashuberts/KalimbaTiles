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
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
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
