// Midnight Heist — sound. Everything is synthesised with WebAudio:
// no audio files, no network. A tiny helper plays short oscillator
// blips; each game event picks its own little phrase.

export function createAudio() {
  let ctx = null;
  let alarmTickAt = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    pickup() {
      tone(660, 0.09, 'sine', 0.12);
      tone(990, 0.14, 'sine', 0.12, 0.07);
    },
    coin() {
      tone(1900, 0.05, 'square', 0.05);
      tone(1500, 0.06, 'square', 0.04, 0.05);
    },
    smoke() {
      tone(320, 0.25, 'sine', 0.08, 0, 120);
    },
    emp() {
      tone(1200, 0.35, 'sawtooth', 0.07, 0, 90);
    },
    crackTick() {
      tone(520, 0.04, 'square', 0.04);
    },
    caught() {
      tone(440, 0.3, 'sawtooth', 0.1, 0, 110);
      tone(220, 0.5, 'sawtooth', 0.1, 0.25, 55);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.11, i * 0.12));
    },
    // A soft metronome tick while the alarm is high, so tension is audible.
    alarmTick(nowMs, alarm) {
      if (alarm < 60) return;
      if (nowMs - alarmTickAt < 500) return;
      alarmTickAt = nowMs;
      tone(880, 0.06, 'square', alarm > 85 ? 0.09 : 0.05);
    },
  };
}
