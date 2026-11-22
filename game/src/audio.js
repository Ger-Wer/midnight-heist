// audio.js: every sound is synthesized with WebAudio — no audio files.
// A tiny synth: short blips for pickups, a low tick while the vault cracks,
// a rising alarm pulse, and a win/lose jingle. Created lazily on the first
// user gesture, so the browser's autoplay rules never block the game.

let ctx = null;
let alarmOsc = null;
let alarmGain = null;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

function tone(freq, seconds, type, volume, when = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

export function playPickup() {
  tone(880, 0.12, 'sine', 0.18);
  tone(1318, 0.16, 'sine', 0.14, 0.07);
}

export function playCoin() {
  tone(1568, 0.08, 'triangle', 0.12);
}

export function playSmoke() {
  tone(220, 0.35, 'sawtooth', 0.06);
  tone(180, 0.4, 'sawtooth', 0.05, 0.08);
}

export function playEmp() {
  tone(1200, 0.3, 'square', 0.05);
  tone(300, 0.45, 'square', 0.06, 0.1);
}

export function playCrackTick() {
  tone(2400, 0.05, 'square', 0.07);
}

export function playVaultOpen() {
  tone(523, 0.18, 'sine', 0.16);
  tone(659, 0.18, 'sine', 0.16, 0.12);
  tone(784, 0.3, 'sine', 0.16, 0.24);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.16, i * 0.13));
}

export function playCaught() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.1, i * 0.16));
}

// The alarm pulse: a quiet two-tone loop whose speed follows the alarm
// level. Started once, its rate is updated every frame; stopped on win/lose.
export function setAlarmPulse(level) {
  if (!ctx) return;
  if (level <= 0.05) {
    stopAlarmPulse();
    return;
  }
  if (!alarmOsc) {
    alarmOsc = ctx.createOscillator();
    alarmGain = ctx.createGain();
    alarmOsc.type = 'sine';
    alarmOsc.frequency.value = 620;
    alarmGain.gain.value = 0;
    alarmOsc.connect(alarmGain);
    alarmGain.connect(ctx.destination);
    alarmOsc.start();
  }
  const speed = 1 + level * 7; // pulses per second
  const t = ctx.currentTime;
  alarmGain.gain.cancelScheduledValues(t);
  alarmGain.gain.setValueAtTime(alarmGain.gain.value, t);
  alarmGain.gain.linearRampToValueAtTime(0.05 + level * 0.05, t + 0.05);
  alarmOsc.frequency.setValueAtTime(520 + level * 260, t);
  void speed;
}

export function stopAlarmPulse() {
  if (alarmOsc) {
    try {
      alarmOsc.stop();
    } catch {
      // already stopped
    }
    alarmOsc.disconnect();
    alarmOsc = null;
    alarmGain = null;
  }
}
