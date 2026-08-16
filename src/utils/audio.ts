// Web Audio API Utility für Sound Effects

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error('Audio playback failed', e);
  }
};

export const playTurnSound = () => {
  // A pleasant double chime für "Your Turn"
  playTone(523.25, 'sine', 0.5, 0.2); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.6, 0.2), 150); // E5
};

export const playSuccessSound = () => {
  // A quick happy blip für Target/Sleeper
  playTone(880, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(1108.73, 'sine', 0.3, 0.1), 100);
};

export const playWarningSound = () => {
  // A low dull buzz für Avoid/Fade
  playTone(150, 'sawtooth', 0.4, 0.1);
};
