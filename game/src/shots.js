// Midnight Heist — screenshot staging. Each named shot freezes the game
// into one exact, hand-placed scene and pauses the simulation, so the
// rendered frame is the same every time. The frame is then captured by
// the harness through main.ts.

function base(game) {
  const s = game.state;
  s.status = 'playing';
  s.paused = true;
  s.message = '';
  s.smokes = [];
  s.coins = [];
  s.safeProgress = 0;
  return s;
}

function setGuard(s, i, x, y, angle, seen = false) {
  const g = s.guards[i];
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.seen = seen;
  g.mode = 'patrol';
  g.investigate = null;
}

function setCamera(s, i, angle, off = false) {
  const c = s.cameras[i];
  c.angle = angle;
  c.offUntil = off ? s.time + 100 : 0;
}

export function applyShot(game, name) {
  const s = base(game);

  if (name === 'cover') {
    // The whole heist in one frame: the thief mid-gallery, a guard cone
    // sweeping past, the vault glowing top right, the alarm already warm.
    s.time = 45;
    s.timeLeft = 135;
    s.alarm = 35;
    s.loot = { diamond: false, painting: false, vase: true, safe: false };
    s.thief.x = 640; s.thief.y = 400; s.thief.angle = -0.7;
    setGuard(s, 0, 560, 300, 0.9);
    setGuard(s, 1, 240, 240, 1.2);
    setGuard(s, 2, 980, 300, -1.4);
    setCamera(s, 0, 1.35);
    setCamera(s, 1, 1.1);
  } else if (name === 'play') {
    // Tense moment: the thief flat behind a crate while a guard's cone
    // sweeps past, a coin mid-flight to pull the guard away.
    s.time = 30;
    s.timeLeft = 150;
    s.alarm = 18;
    s.loot = { diamond: false, painting: false, vase: false, safe: false };
    s.thief.x = 620; s.thief.y = 210; s.thief.angle = 0.4;
    setGuard(s, 0, 780, 330, -1.9);
    setGuard(s, 1, 200, 300, 0.3);
    setGuard(s, 2, 1080, 420, 2.6);
    setCamera(s, 0, 0.9);
    setCamera(s, 1, 1.5);
    s.coins = [{ x: 700, y: 250, tx: 780, ty: 300 }];
  } else if (name === 'alarm') {
    // Almost caught: alarm at 82, a guard converging, a camera cone
    // right on the thief near the vault door.
    s.time = 90;
    s.timeLeft = 90;
    s.alarm = 82;
    s.loot = { diamond: true, painting: true, vase: false, safe: false };
    s.thief.x = 1000; s.thief.y = 300; s.thief.angle = 2.8;
    setGuard(s, 0, 700, 380, 0.2);
    setGuard(s, 1, 300, 500, -0.5);
    setGuard(s, 2, 950, 250, 1.35, true);
    setCamera(s, 0, 1.2);
    setCamera(s, 1, 1.35);
  } else if (name === 'getaway') {
    // Clean getaway: all four valuables, low alarm, the thief at the van.
    // Status stays 'playing' so the win overlay does not hide the scene:
    // the HUD already says LOOT 4/4 — $1400.
    s.time = 135;
    s.timeLeft = 45;
    s.alarm = 12;
    s.loot = { diamond: true, painting: true, vase: true, safe: true };
    s.status = 'playing';
    s.thief.x = 1164; s.thief.y = 22; s.thief.angle = -Math.PI / 2;
    setGuard(s, 0, 600, 240, 2.2);
    setGuard(s, 1, 200, 400, 0.8);
    setGuard(s, 2, 1080, 480, -2.0);
    setCamera(s, 0, 0.6);
    setCamera(s, 1, 1.9);
  } else {
    throw new Error(`unknown shot: ${name}`);
  }
}

export const SHOT_NAMES = ['cover', 'play', 'alarm', 'getaway'];
