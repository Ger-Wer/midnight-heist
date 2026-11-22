// main.js: the game loop and the state machine.
// Screens: title → play → won / caught. The HUD lives in the DOM overlay
// (index.html) because canvas text does not render in Obscura; the canvas
// draws only the world. Every frame: read input, step the thief, the guards
// and the cameras, raise or cool the alarm, then draw.

import { VIEW, GAME, ALARM, TOOLS } from './config.js';
import { makeGuards, stepGuard, distractGuards, setChase } from './guards.js';
import { makeCameras, stepCamera, blindCameras } from './cameras.js';
import { makePlayer, stepPlayer, stepCrack, pickupLoot, atExit, canEscape, nearVault } from './player.js';
import { render } from './render.js';
import { makeInput } from './input.js';
import { applyShot, shotFromUrl, lootName } from './shots.js';
import { inShadow } from './level.js';
import {
  ensureAudio,
  playPickup,
  playCoin,
  playSmoke,
  playEmp,
  playCrackTick,
  playVaultOpen,
  playWin,
  playCaught,
  setAlarmPulse,
  stopAlarmPulse,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const el = (id) => document.getElementById(id);
const hudAlarmFill = el('alarm-fill');
const hudAlarmText = el('alarm-text');
const hudTimer = el('timer');
const hudLoot = el('loot');
const hudTools = el('tools');
const hudMessage = el('message');
const screenTitle = el('screen-title');
const screenEnd = el('screen-end');
const endTitle = el('end-title');
const endScore = el('end-score');
const endDetail = el('end-detail');

const input = makeInput(canvas);
input.onFirstGesture(() => ensureAudio());

const state = {
  screen: 'title', // title | play | won | caught
  time: 0,
  timeLeft: GAME.timeLimit,
  alarm: 0,
  maxAlarm: 0,
  player: makePlayer(),
  guards: makeGuards(),
  cameras: makeCameras(),
  coins: [], // thrown coins lying on the floor {x, y, vx, vy, flying}
  smokes: [], // {x, y, left}
  score: 0,
  endReason: '',
};

const shot = shotFromUrl();
if (shot) applyShot(state, shot);

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function alarmColor(a) {
  if (a < 40) return '#37d67a';
  if (a < 70) return '#e8c15a';
  return '#e5484d';
}

function updateHud() {
  const p = state.player;
  hudAlarmFill.style.width = `${state.alarm}%`;
  hudAlarmFill.style.background = alarmColor(state.alarm);
  hudAlarmText.textContent = `ALARM ${Math.round(state.alarm)}`;
  hudTimer.textContent = fmtTime(state.timeLeft);
  hudLoot.textContent = `LOOT $${p.lootValue.toLocaleString('en-US')} · ${p.loot.length}/4`;
  hudTools.textContent = `Coins ×${p.coins} · Smoke ×${p.smokes} · EMP ×${p.emps}`;
  if (state.screen === 'play') {
    if (!canEscape(p) && p.loot.length > 0) {
      hudMessage.textContent = `Need ${3 - p.loot.length} more loot before the exit opens.`;
    } else if (canEscape(p)) {
      hudMessage.textContent = 'Exit is open — reach the red getaway car!';
    } else if (nearVault(p) && !p.vaultCracked) {
      hudMessage.textContent = 'Hold F to crack the vault…';
    } else {
      hudMessage.textContent = 'WASD move · Click throws a coin · Q smoke · E EMP · F crack vault';
    }
  }
}

function showTitle() {
  screenTitle.style.display = 'flex';
  screenEnd.style.display = 'none';
  hudMessage.textContent = 'Click or press Enter to start the heist.';
}

function showEnd(won) {
  screenTitle.style.display = 'none';
  screenEnd.style.display = 'flex';
  endTitle.textContent = won ? 'CLEAN GETAWAY!' : 'CAUGHT!';
  endTitle.style.color = won ? '#37d67a' : '#e5484d';
  const p = state.player;
  const timeBonus = won ? Math.round(state.timeLeft) * GAME.timeBonusPerSecond : 0;
  const ghost = won && state.maxAlarm < ALARM.ghostLimit ? GAME.ghostBonus : 0;
  state.score = p.lootValue + timeBonus + ghost;
  endScore.textContent = `Score $${state.score.toLocaleString('en-US')}`;
  endDetail.textContent = won
    ? `Loot $${p.lootValue.toLocaleString('en-US')} · time bonus $${timeBonus.toLocaleString('en-US')}${
        ghost ? ` · Ghost bonus $${ghost.toLocaleString('en-US')}` : ''
      }`
    : state.endReason;
  hudMessage.textContent = 'Press R to try again.';
}

function startGame() {
  state.screen = 'play';
  screenTitle.style.display = 'none';
  screenEnd.style.display = 'none';
}

function endGame(won, reason) {
  state.screen = won ? 'won' : 'caught';
  state.endReason = reason;
  stopAlarmPulse();
  if (won) playWin();
  else playCaught();
  showEnd(won);
}

function throwCoin(x, y) {
  const p = state.player;
  if (state.screen !== 'play' || p.coins <= 0) return;
  p.coins -= 1;
  playCoin();
  // The coin lands a short hop toward the click, then lies there ringing.
  const dx = x - p.x;
  const dy = y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  const hop = Math.min(90, d * 0.5);
  const lx = p.x + (dx / d) * hop;
  const ly = p.y + (dy / d) * hop;
  state.coins.push({ x: lx, y: ly, left: 4 });
  distractGuards(state.guards, lx, ly);
}

function dropSmoke() {
  const p = state.player;
  if (state.screen !== 'play' || p.smokes <= 0) return;
  p.smokes -= 1;
  playSmoke();
  state.smokes.push({ x: p.x, y: p.y, left: TOOLS.smokeSeconds });
}

function fireEmp() {
  const p = state.player;
  if (state.screen !== 'play' || p.emps <= 0) return;
  p.emps -= 1;
  playEmp();
  blindCameras(state.cameras, TOOLS.empSeconds);
}

let lastCrackTick = 0;

function step(dt) {
  if (state.screen !== 'play') return;
  state.time += dt;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endGame(false, 'Out of time — the sun came up and the bank opened.');
    return;
  }

  const p = state.player;
  stepPlayer(p, dt, input.keys);

  // Tools.
  for (const c of input.clicks.splice(0)) throwCoin(c.x, c.y);
  if (input.keys.has('q')) {
    input.keys.delete('q');
    dropSmoke();
  }
  if (input.keys.has('e')) {
    input.keys.delete('e');
    fireEmp();
  }
  const holdingF = input.keys.has('f');
  if (stepCrack(p, dt, holdingF)) {
    playVaultOpen();
  } else if (holdingF && nearVault(p) && !p.vaultCracked) {
    if (state.time - lastCrackTick > 0.25) {
      lastCrackTick = state.time;
      playCrackTick();
    }
  }

  // Loot.
  const got = pickupLoot(p);
  if (got) {
    playPickup();
    hudMessage.textContent = `Got the ${lootName(got.id)} — $${got.value.toLocaleString('en-US')}!`;
  }

  // Coins fade; smoke thins out.
  for (const c of state.coins) c.left -= dt;
  state.coins = state.coins.filter((c) => c.left > 0);
  for (const s of state.smokes) s.left -= dt;
  state.smokes = state.smokes.filter((s) => s.left > 0);

  // Eyes on the thief: guards and cameras raise the alarm, hiding cools it.
  let rise = 0;
  for (const g of state.guards) rise += stepGuard(g, dt, p, state.smokes);
  for (const c of state.cameras) rise += stepCamera(c, dt, state.time, p, state.smokes);
  if (rise > 0) {
    state.alarm = Math.min(ALARM.caughtAt, state.alarm + rise * dt);
  } else {
    const decay = inShadow(p.x, p.y) ? ALARM.shadowDecay : ALARM.decay;
    state.alarm = Math.max(0, state.alarm - decay * dt);
  }
  state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
  setChase(state.guards, state.alarm > 70);
  setAlarmPulse(state.alarm / 100);

  if (state.alarm >= ALARM.caughtAt) {
    endGame(false, 'Spotted — the alarm hit 100 and the guards closed in.');
    return;
  }

  // Win: at the car with enough loot.
  if (atExit(p)) {
    if (canEscape(p)) {
      endGame(true, '');
    } else {
      hudMessage.textContent = `The car will not leave with only ${p.loot.length} loot — need ${3 - p.loot.length} more.`;
    }
  }
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.screen === 'title') {
    if (input.keys.has('enter') || input.clicks.length > 0) {
      input.clicks.length = 0;
      input.keys.delete('enter');
      ensureAudio();
      startGame();
    }
  } else if (state.screen === 'won' || state.screen === 'caught') {
    if (input.keys.has('r')) {
      input.keys.delete('r');
      location.reload();
    }
  } else {
    step(dt);
  }

  render(ctx, state);
  updateHud();
  requestAnimationFrame(frame);
}

if (state.screen === 'title') showTitle();
if (state.screen === 'won' || state.screen === 'caught') showEnd(state.screen === 'won');
updateHud();
requestAnimationFrame(frame);
