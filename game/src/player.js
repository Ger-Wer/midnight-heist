// player.js: the thief — movement, tools, loot and the vault.
// The thief walks with WASD or arrows, throws coins with a mouse click,
// drops smoke with Q, fires the EMP with E and cracks the vault by holding F
// beside its door. Loot is picked up by walking over it.

import { PLAYER, TOOLS, VAULT, LOOT, GAME } from './config.js';
import { VAULT_DOOR } from './level.js';
import { moveCircle } from './guards.js';

export function makePlayer() {
  return {
    x: GAME.startX,
    y: GAME.startY,
    angle: -Math.PI / 2, // facing up, into the bank
    coins: TOOLS.coins,
    smokes: TOOLS.smoke,
    emps: TOOLS.emp,
    loot: [], // collected loot ids
    lootValue: 0,
    vaultCracked: false,
    crackProgress: 0, // 0..1 while holding F at the vault door
    moving: false,
  };
}

// Move with the keys held down. Returns nothing; the position is clamped by
// the walls through moveCircle.
export function stepPlayer(p, dt, keys) {
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  p.moving = dx !== 0 || dy !== 0;
  if (!p.moving) return;
  const len = Math.hypot(dx, dy);
  dx = (dx / len) * PLAYER.speed * dt;
  dy = (dy / len) * PLAYER.speed * dt;
  const moved = moveCircle(p.x, p.y, PLAYER.radius, dx, dy);
  p.x = moved.x;
  p.y = moved.y;
  p.angle = Math.atan2(dy, dx);
}

// Near the vault door? The crack spot is just below the round door.
export function nearVault(p) {
  return Math.hypot(p.x - VAULT_DOOR.crackX, p.y - VAULT_DOOR.crackY) < 46;
}

// Hold F beside the vault: progress grows; step away and it drains.
// Returns true the moment the vault cracks open.
export function stepCrack(p, dt, holdingF) {
  if (p.vaultCracked) return false;
  if (holdingF && nearVault(p)) {
    p.crackProgress += dt / VAULT.crackSeconds;
    if (p.crackProgress >= 1) {
      p.crackProgress = 1;
      p.vaultCracked = true;
      p.loot.push('vault');
      p.lootValue += VAULT.value;
      return true;
    }
  } else {
    p.crackProgress = Math.max(0, p.crackProgress - dt * 0.7);
  }
  return false;
}

// Walk over a loot piece to pick it up. Returns the piece, or null.
export function pickupLoot(p) {
  for (const item of LOOT.items) {
    if (p.loot.includes(item.id)) continue;
    if (Math.hypot(p.x - item.x, p.y - item.y) < 26) {
      p.loot.push(item.id);
      p.lootValue += item.value;
      return item;
    }
  }
  return null;
}

// At the getaway car with enough loot? That is the win.
export function atExit(p) {
  return Math.hypot(p.x - GAME.exitX, p.y - GAME.exitY) < GAME.exitRadius;
}

export function lootCount(p) {
  return p.loot.length;
}

export function canEscape(p) {
  return lootCount(p) >= LOOT.needToWin;
}
