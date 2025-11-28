import { useRef } from 'react';

export function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const AudioCtxClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      audioCtxRef.current = new AudioCtxClass();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playTone = (freq: number, duration = 0.12, type: OscillatorType = 'sine') => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.stop(now + duration + 0.02);
  };

  const playSequence = (notes: Array<{ f: number; d?: number }>) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    let t = ctx.currentTime;
    notes.forEach((n) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = n.f;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (n.d ?? 0.12));
      o.stop(t + (n.d ?? 0.12) + 0.02);
      t += (n.d ?? 0.12) + 0.02;
    });
  };

  const playSoundForEvent = (ev: 'start' | 'pick' | 'ban' | 'phase') => {
    try {
      if (ev === 'start') {
        playSequence([{ f: 440, d: 0.08 }, { f: 660, d: 0.12 }, { f: 880, d: 0.16 }]);
      } else if (ev === 'pick') {
        playTone(880, 0.12, 'sine');
      } else if (ev === 'ban') {
        playTone(220, 0.12, 'sine');
      } else if (ev === 'phase') {
        playSequence([{ f: 660, d: 0.06 }, { f: 880, d: 0.06 }]);
      }
    } catch {
      // ignore audio errors
    }
  };

  return { playSoundForEvent };
}