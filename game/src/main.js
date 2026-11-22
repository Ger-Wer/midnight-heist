// Midnight Heist — entry point. Wires the canvas, the DOM HUD and the
// overlays to the simulation. With ?shot=<name> it renders one frozen,
// staged frame instead of starting the game (used for screenshots).

import { createGame } from './game.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { applyShot } from './shots.js';
import { WORLD, LOOT, WIN_LOOT_MIN } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();
const audio = createAudio();
const game = createGame();

const el = (id) => document.getElementById(id);

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function syncHud() {
  const s = game.state;
  el('timer').textContent = fmtTime(s.timeLeft);
  const count = game.lootCount();
  el('loot').textContent = `LOOT ${count}/4 — $${game.lootValue()}`;
  const fill = el('alarm-fill');
  fill.style.width = `${s.alarm}%`;
  fill.classList.toggle('hot', s.alarm >= 75);
  fill.classList.toggle('warm', s.alarm >= 40 && s.alarm < 75);
  el('alarm-label').textContent = `ALARM ${Math.round(s.alarm)}%`;
  el('tools').textContent =
    `Coins ${s.tools.coins} · Smoke ${s.tools.smoke} · EMP ${s.tools.emp}`;
  el('objective').textContent =
    count >= WIN_LOOT_MIN
      ? 'To the van — top right!'
      : `Steal ${WIN_LOOT_MIN}/4, then the van`;
  el('message').textContent = s.message;
  document.body.classList.toggle('alarm-warn', s.alarmWarn && s.status === 'playing');

  const overlay = el('overlay');
  const title = el('overlay-title');
  const text = el('overlay-text');
  const btn = el('overlay-btn');
  if (s.status === 'title') {
    overlay.classList.remove('hidden');
    title.textContent = 'MIDNIGHT HEIST';
    text.innerHTML =
      'One thief. One museum. Four valuables.<br>' +
      'Slip past the guards, dodge the cameras, crack the safe — ' +
      'and be at the van before dawn.<br><br>' +
      'Move — WASD / arrows &nbsp;·&nbsp; Throw a coin — click &nbsp;·&nbsp; ' +
      'Smoke — Q &nbsp;·&nbsp; EMP — E &nbsp;·&nbsp; Crack the safe — hold F<br>' +
      'Shadows slow the alarm. A coin pulls a guard away.';
    btn.textContent = 'Start the heist';
    btn.onclick = () => {
      audio.unlock();
      input.markStarted();
      game.start();
    };
  } else if (s.status === 'caught') {
    overlay.classList.remove('hidden');
    title.textContent = 'CAUGHT!';
    text.textContent = `The alarm hit 100%. The museum woke up — and so did the police. Loot kept: $${game.lootValue()}.`;
    btn.textContent = 'Try again';
    btn.onclick = () => window.location.reload();
  } else if (s.status === 'won') {
    overlay.classList.remove('hidden');
    title.textContent = 'CLEAN GETAWAY';
    text.textContent = `Out the door and into the van — $${game.lootValue()} in loot` +
      (s.ghost ? ', and nobody ever saw you. Ghost bonus +$200.' : '.') +
      ` Final score: ${s.score}.`;
    btn.textContent = 'Steal again';
    btn.onclick = () => window.location.reload();
  } else if (s.status === 'timeout') {
    overlay.classList.remove('hidden');
    title.textContent = 'DAWN BREAKS';
    text.textContent = `The sun is up and the van is gone. Loot kept: $${game.lootValue()}.`;
    btn.textContent = 'Try again';
    btn.onclick = () => window.location.reload();
  } else {
    overlay.classList.add('hidden');
  }
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshot mode: one frozen frame, no loop, no sound.
  applyShot(game, shot);
  render(ctx, game);
  syncHud();
  document.title = `Midnight Heist — ${shot}`;
} else {
  input.attach(canvas);
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(dt, input, audio);
    render(ctx, game);
    syncHud();
    requestAnimationFrame(frame);
  }
  render(ctx, game);
  syncHud();
  requestAnimationFrame(frame);
}
