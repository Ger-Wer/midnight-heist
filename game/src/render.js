// Midnight Heist — rendering. Canvas draws shapes only: no text is ever
// painted on the canvas (the HUD and overlays are DOM). One frame is a
// pure function of the game state, so screenshots are reproducible.

import {
  WORLD, WALLS, BLOCKERS, CASES, SHADOWS, LOOT_SPOTS, SAFE, ENTRY, EXIT,
  GUARD_CONE_LEN, GUARD_CONE_HALF, CAMERA_CONE_LEN, CAMERA_CONE_HALF,
  SAFE_CRACK_SECONDS,
} from './config.js';

function drawCone(ctx, x, y, angle, len, half, color, edge) {
  // Polygon wedge, not a canvas arc: some headless canvases ignore the
  // start/end angles of arc() and paint a full circle instead. A fan of
  // line segments renders the same wedge everywhere.
  const steps = 14;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= steps; i++) {
    const a = angle - half + (2 * half * i) / steps;
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawRect(ctx, r, color) {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

export function render(ctx, game) {
  const s = game.state;
  const t = s.time;

  // --- floor: dark parquet with a subtle checker ---
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.fillStyle = '#2a1f15';
  const tile = 80;
  for (let y = 0; y < WORLD.h / tile; y++) {
    for (let x = 0; x < WORLD.w / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  // entry carpet runner
  ctx.fillStyle = '#4a1f24';
  ctx.fillRect(60, 560, 240, 88);

  // --- shadow zones: pools of darkness ---
  for (const sh of SHADOWS) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sh.x, sh.y, sh.w, sh.h);
    ctx.strokeStyle = 'rgba(120,140,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sh.x + 1, sh.y + 1, sh.w - 2, sh.h - 2);
  }

  // --- exit: getaway door (the van is drawn after the walls, below) ---
  ctx.fillStyle = '#0c0f16';
  ctx.fillRect(EXIT.x - 8, 0, EXIT.w + 16, 40);
  ctx.fillStyle = '#c8a24a';
  ctx.fillRect(EXIT.x, 0, EXIT.w, 6);

  // --- walls ---
  for (const w of WALLS) drawRect(ctx, w, '#5b4a35');
  ctx.strokeStyle = 'rgba(255,220,150,0.18)';
  ctx.lineWidth = 1;
  for (const w of WALLS) ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);

  // --- the getaway van, parked at the top right door ---
  ctx.fillStyle = '#3d4b63';
  ctx.fillRect(EXIT.x + 4, 4, 80, 26);
  ctx.fillStyle = '#5d7ba3';
  ctx.fillRect(EXIT.x + 58, 8, 20, 18);
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(EXIT.x + 20, 32, 6, 0, Math.PI * 2);
  ctx.arc(EXIT.x + 66, 32, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c8a24a';
  ctx.fillRect(EXIT.x + 4, 30, 80, 2);

  // --- display cases (glass, do not block sight) ---
  for (const c of CASES) {
    ctx.fillStyle = '#31424e';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(150,220,255,0.28)';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = '#9fc4d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  }

  // --- crates and pillars ---
  for (const b of BLOCKERS) {
    if (b.kind === 'crate') {
      ctx.fillStyle = '#6b4f2a';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#8a6a3c';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.w, b.y + b.h);
      ctx.moveTo(b.x + b.w, b.y);
      ctx.lineTo(b.x, b.y + b.h);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#4c3d2c';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#6b563e';
      ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
    }
  }

  // --- vision cones (under the loot and the guards, above the floor) ---
  for (const c of s.cameras) {
    const off = t < c.offUntil;
    drawCone(ctx, c.x, c.y, c.angle, CAMERA_CONE_LEN, CAMERA_CONE_HALF,
      off ? 'rgba(80,80,80,0.08)' : 'rgba(255,60,60,0.13)',
      off ? 'rgba(120,120,120,0.25)' : 'rgba(255,90,90,0.35)');
  }
  for (const g of s.guards) {
    drawCone(ctx, g.x, g.y, g.angle, GUARD_CONE_LEN, GUARD_CONE_HALF,
      g.seen ? 'rgba(255,40,40,0.20)' : 'rgba(255,210,90,0.10)',
      g.seen ? 'rgba(255,70,70,0.45)' : 'rgba(255,220,120,0.30)');
  }

  // --- loot spots ---
  for (const spot of LOOT_SPOTS) {
    if (s.loot[spot.id]) continue;
    const pulse = 0.85 + 0.15 * Math.sin(t * 3 + spot.x);
    if (spot.id === 'diamond') {
      // Polygon diamond: no transforms, no arcs — renders identically in
      // every canvas, including headless ones that mishandle transforms.
      const d = 16;
      ctx.fillStyle = `rgba(140,230,255,${pulse})`;
      ctx.beginPath();
      ctx.moveTo(spot.x, spot.y - d);
      ctx.lineTo(spot.x + d, spot.y);
      ctx.lineTo(spot.x, spot.y + d);
      ctx.lineTo(spot.x - d, spot.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(spot.x, spot.y - 6);
      ctx.lineTo(spot.x + 6, spot.y);
      ctx.lineTo(spot.x, spot.y + 6);
      ctx.lineTo(spot.x - 6, spot.y);
      ctx.closePath();
      ctx.fill();
    } else if (spot.id === 'painting') {
      ctx.fillStyle = '#7a5a20';
      ctx.fillRect(spot.x - 26, spot.y - 18, 52, 36);
      ctx.fillStyle = `rgba(220,170,90,${pulse})`;
      ctx.fillRect(spot.x - 20, spot.y - 12, 40, 24);
      ctx.fillStyle = '#3a2a10';
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Polygon vase: straight edges only — some headless canvases do
      // not render quadratic curves at all.
      ctx.fillStyle = `rgba(220,180,100,${pulse})`;
      ctx.beginPath();
      ctx.moveTo(spot.x - 6, spot.y - 20);
      ctx.lineTo(spot.x + 6, spot.y - 20);
      ctx.lineTo(spot.x + 13, spot.y - 4);
      ctx.lineTo(spot.x + 10, spot.y + 13);
      ctx.lineTo(spot.x - 10, spot.y + 13);
      ctx.lineTo(spot.x - 13, spot.y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,200,0.9)';
      ctx.beginPath();
      ctx.arc(spot.x, spot.y - 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- the safe ---
  ctx.fillStyle = '#3a3f47';
  ctx.fillRect(SAFE.x - 22, SAFE.y - 22, 44, 44);
  ctx.fillStyle = '#565e6b';
  ctx.fillRect(SAFE.x - 16, SAFE.y - 16, 32, 32);
  ctx.fillStyle = '#c8a24a';
  ctx.beginPath();
  ctx.arc(SAFE.x, SAFE.y, 8, 0, Math.PI * 2);
  ctx.fill();
  if (!s.loot.safe && s.safeProgress > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(SAFE.x - 24, SAFE.y - 34, 48, 7);
    ctx.fillStyle = '#c8a24a';
    ctx.fillRect(SAFE.x - 23, SAFE.y - 33, 46 * (s.safeProgress / SAFE_CRACK_SECONDS), 5);
  }

  // --- smoke clouds ---
  for (const sm of s.smokes) {
    const alpha = Math.min(0.85, (sm.until - t) * 0.5);
    ctx.fillStyle = `rgba(200,200,210,${alpha})`;
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220,220,230,${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(sm.x - 24, sm.y - 10, 42, 0, Math.PI * 2);
    ctx.arc(sm.x + 26, sm.y + 8, 46, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- cameras (wall mounted) ---
  for (const c of s.cameras) {
    const off = t < c.offUntil;
    ctx.fillStyle = off ? '#555' : '#222';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = off ? '#777' : '#ff3b30';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- thrown coins ---
  for (const c of s.coins) {
    ctx.fillStyle = '#e8c34a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- guards ---
  for (const g of s.guards) {
    ctx.fillStyle = '#2b3a55';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8b24a';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 6, g.y + Math.sin(g.angle) * 6, 5, 0, Math.PI * 2);
    ctx.fill();
    // flashlight dot at the cone tip
    ctx.fillStyle = g.seen ? 'rgba(255,60,60,0.9)' : 'rgba(255,220,120,0.7)';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 26, g.y + Math.sin(g.angle) * 26, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- the thief ---
  const th = s.thief;
  ctx.fillStyle = '#1c1c22';
  ctx.beginPath();
  ctx.arc(th.x, th.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e8f0';
  ctx.beginPath();
  ctx.arc(th.x + Math.cos(th.angle) * 5, th.y + Math.sin(th.angle) * 5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c22';
  ctx.beginPath();
  ctx.arc(th.x + Math.cos(th.angle) * 7, th.y + Math.sin(th.angle) * 7, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // loot bag grows with the haul
  const haul = Object.values(s.loot).filter(Boolean).length;
  if (haul > 0) {
    ctx.fillStyle = '#c8a24a';
    ctx.beginPath();
    ctx.arc(th.x - Math.cos(th.angle) * 12, th.y - Math.sin(th.angle) * 12, 4 + haul, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- caught flash: the frame closes in ---
  if (s.status === 'caught') {
    ctx.fillStyle = 'rgba(160,0,0,0.25)';
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  }
}
