// render.js: everything the eye sees, drawn on the canvas.
// Obscura-safe on purpose: only moveTo/lineTo polygons, fillRect and FULL
// circles (arc 0..2PI). No translate/rotate, no partial arcs and no
// quadratic curves — Obscura misdraws those. All text lives in the DOM
// overlay (index.html), because canvas fillText does not render in Obscura.

import { VIEW, PALETTE, GUARD, CAMERA, GAME } from './config.js';
import { WALLS, FURNITURE, SHADOWS, LIGHTS, VAULT_DOOR } from './level.js';
import { LOOT } from './config.js';

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

// A vision cone as a flat fan of line segments: apex plus points along the
// arc. No arc() call at all, so Obscura draws it exactly.
function conePoints(x, y, angle, halfAngle, length, steps = 12) {
  const pts = [[x, y]];
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    pts.push([x + Math.cos(a) * length, y + Math.sin(a) * length]);
  }
  return pts;
}

function drawCone(ctx, x, y, angle, halfAngle, length, fill, edge) {
  const pts = conePoints(x, y, angle, halfAngle, length);
  ctx.fillStyle = fill;
  polygon(ctx, pts);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.moveTo(x, y);
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Marble tiles: a quiet checkerboard of two dark blues.
  ctx.fillStyle = PALETTE.floorTile;
  const t = 40;
  for (let y = 0; y < VIEW.height; y += t) {
    for (let x = 0; x < VIEW.width; x += t) {
      if (((x / t) | 0) % 2 === ((y / t) | 0) % 2) ctx.fillRect(x, y, t, t);
    }
  }
  // Warm light pools under the ceiling lamps.
  for (const l of LIGHTS) {
    ctx.fillStyle = PALETTE.lightPool;
    circle(ctx, l.x, l.y, l.r);
  }
  // Carpet in the middle of the lobby.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(440, 280, 150, 90);
  ctx.strokeStyle = '#3a466e';
  ctx.lineWidth = 2;
  ctx.strokeRect(440, 280, 150, 90);
  // Shadow zones: dark patches where eyes are half as sharp.
  for (const s of SHADOWS) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    if (w.w <= 0 || w.h <= 0) continue;
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    if (w.h <= 14) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
  }
}

function drawFurniture(ctx) {
  for (const f of FURNITURE) {
    if (f.kind === 'desk') {
      ctx.fillStyle = PALETTE.desk;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = PALETTE.deskTop;
      ctx.fillRect(f.x + 4, f.y + 4, f.w - 8, f.h - 8);
      ctx.fillStyle = '#2c2113';
      ctx.fillRect(f.x + 8, f.y + f.h / 2 - 2, f.w - 16, 4);
    } else if (f.kind === 'plant') {
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(f.x + 7, f.y + 16, 16, 14);
      ctx.fillStyle = PALETTE.plant;
      circle(ctx, f.x + 15, f.y + 12, 13);
      ctx.fillStyle = '#2f7a44';
      circle(ctx, f.x + 10, f.y + 8, 7);
      circle(ctx, f.x + 21, f.y + 9, 6);
    }
    // rugs are drawn on the floor already; nothing to add here.
  }
}

function drawVaultDoor(ctx, cracked) {
  const v = VAULT_DOOR;
  // Steel ring and door on the vault room's back wall.
  ctx.fillStyle = PALETTE.vaultRing;
  circle(ctx, v.x, v.y, v.radius + 6);
  ctx.fillStyle = cracked ? '#10182c' : PALETTE.vaultDoor;
  circle(ctx, v.x, v.y, v.radius);
  if (!cracked) {
    // Spokes and hub: straight bars only.
    ctx.fillStyle = '#7e8ea8';
    ctx.fillRect(v.x - 3, v.y - v.radius + 6, 6, v.radius * 2 - 12);
    ctx.fillRect(v.x - v.radius + 6, v.y - 3, v.radius * 2 - 12, 6);
    ctx.fillStyle = PALETTE.vaultRing;
    circle(ctx, v.x, v.y, 9);
  } else {
    // Open vault: a dark mouth with gold inside.
    ctx.fillStyle = '#e8c15a';
    ctx.fillRect(v.x - 16, v.y - 10, 32, 20);
    ctx.fillStyle = '#7a5c14';
    ctx.fillRect(v.x - 16, v.y - 2, 32, 4);
  }
}

function drawLoot(ctx, loot) {
  for (const item of LOOT.items) {
    if (loot.includes(item.id)) continue; // already pocketed
    if (item.kind === 'bars') {
      ctx.fillStyle = '#e8c15a';
      ctx.fillRect(item.x - 14, item.y - 5, 28, 10);
      ctx.fillStyle = '#f5d97a';
      ctx.fillRect(item.x - 10, item.y - 11, 20, 8);
      ctx.fillStyle = '#7a5c14';
      ctx.fillRect(item.x - 14, item.y + 5, 28, 2);
    } else if (item.kind === 'cash') {
      ctx.fillStyle = '#2f7a44';
      ctx.fillRect(item.x - 14, item.y - 8, 28, 16);
      ctx.fillStyle = '#4caf6d';
      ctx.fillRect(item.x - 10, item.y - 5, 20, 10);
      ctx.fillStyle = '#e8e4d2';
      ctx.fillRect(item.x - 2, item.y - 8, 4, 16);
    } else if (item.kind === 'gem') {
      // A diamond as a four-point polygon (no curves, no rotate).
      ctx.fillStyle = '#5aa9e6';
      polygon(ctx, [
        [item.x, item.y - 14],
        [item.x + 11, item.y],
        [item.x, item.y + 14],
        [item.x - 11, item.y],
      ]);
      ctx.fillStyle = '#bfe3ff';
      polygon(ctx, [
        [item.x, item.y - 14],
        [item.x + 5, item.y - 2],
        [item.x - 5, item.y - 2],
      ]);
    }
    // A soft glow under each loot piece so it reads at a glance.
    ctx.fillStyle = 'rgba(255, 220, 120, 0.10)';
    circle(ctx, item.x, item.y, 26);
  }
}

function drawExit(ctx, open) {
  const { x, y } = { x: GAME.exitX, y: GAME.exitY };
  // Getaway car, top-down: body, cabin, wheels, headlights.
  ctx.fillStyle = open ? 'rgba(55, 214, 122, 0.18)' : 'rgba(55, 214, 122, 0.07)';
  circle(ctx, x, y, GAME.exitRadius + 12);
  ctx.fillStyle = '#222a44';
  ctx.fillRect(x - 12, y - 26, 8, 12);
  ctx.fillRect(x + 4, y - 26, 8, 12);
  ctx.fillRect(x - 12, y + 14, 8, 12);
  ctx.fillRect(x + 4, y + 14, 8, 12);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x - 14, y - 22, 28, 44);
  ctx.fillStyle = '#7fb3d5';
  ctx.fillRect(x - 10, y - 8, 20, 16);
  ctx.fillStyle = '#f5e6a8';
  ctx.fillRect(x - 12, y - 24, 5, 4);
  ctx.fillRect(x + 7, y - 24, 5, 4);
  if (open) {
    ctx.strokeStyle = PALETTE.exitGlow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, GAME.exitRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    const alert = g.state === 'chase';
    drawCone(
      ctx,
      g.x,
      g.y,
      g.angle,
      GUARD.viewHalfAngle,
      GUARD.viewLength,
      alert ? 'rgba(255, 90, 90, 0.22)' : GUARD.coneColor,
      alert ? 'rgba(255, 90, 90, 0.5)' : GUARD.coneEdge,
    );
    ctx.fillStyle = GUARD.outline;
    circle(ctx, g.x, g.y, GUARD.radius + 2);
    ctx.fillStyle = alert ? '#c0392b' : GUARD.color;
    circle(ctx, g.x, g.y, GUARD.radius);
    // Facing tick: a small triangle in front of the guard.
    const fx = g.x + Math.cos(g.angle) * (GUARD.radius + 5);
    const fy = g.y + Math.sin(g.angle) * (GUARD.radius + 5);
    ctx.fillStyle = '#e8e4d2';
    polygon(ctx, [
      [fx, fy],
      [g.x + Math.cos(g.angle + 2.5) * 7, g.y + Math.sin(g.angle + 2.5) * 7],
      [g.x + Math.cos(g.angle - 2.5) * 7, g.y + Math.sin(g.angle - 2.5) * 7],
    ]);
    if (g.seen) {
      ctx.fillStyle = '#e5484d';
      circle(ctx, g.x, g.y - GUARD.radius - 8, 4);
    }
  }
}

function drawCameras(ctx, cameras) {
  for (const c of cameras) {
    const blind = c.blindLeft > 0;
    if (!blind) {
      drawCone(
        ctx,
        c.x,
        c.y,
        c.angle,
        CAMERA.viewHalfAngle,
        CAMERA.viewLength,
        c.seen ? 'rgba(255, 90, 90, 0.22)' : CAMERA.coneColor,
        c.seen ? 'rgba(255, 90, 90, 0.5)' : CAMERA.coneEdge,
      );
    }
    // Wall mount: a small grey box with a lens dot.
    ctx.fillStyle = '#5a6274';
    ctx.fillRect(c.x - 9, c.y - 7, 18, 14);
    ctx.fillStyle = blind ? '#3a3f4d' : '#e5484d';
    circle(ctx, c.x, c.y, 4);
    if (blind) {
      ctx.strokeStyle = '#8a93a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 6, c.y - 6);
      ctx.lineTo(c.x + 6, c.y + 6);
      ctx.moveTo(c.x + 6, c.y - 6);
      ctx.lineTo(c.x - 6, c.y + 6);
      ctx.stroke();
    }
  }
}

function drawPlayer(ctx, player, time) {
  // A faint ring while the thief is in shadow: the player can see it, the
  // guards cannot see the thief as well there.
  ctx.fillStyle = 'rgba(232, 193, 90, 0.12)';
  circle(ctx, player.x, player.y, 18);
  ctx.fillStyle = '#7a5c14';
  circle(ctx, player.x, player.y, 12);
  ctx.fillStyle = '#e8c15a';
  circle(ctx, player.x, player.y, 10);
  // Direction tick.
  const fx = player.x + Math.cos(player.angle) * 15;
  const fy = player.y + Math.sin(player.angle) * 15;
  ctx.fillStyle = '#2c2113';
  polygon(ctx, [
    [fx, fy],
    [player.x + Math.cos(player.angle + 2.6) * 6, player.y + Math.sin(player.angle + 2.6) * 6],
    [player.x + Math.cos(player.angle - 2.6) * 6, player.y + Math.sin(player.angle - 2.6) * 6],
  ]);
  void time;
}

function drawEffects(ctx, state) {
  // Thrown coins on the floor.
  ctx.fillStyle = '#f5d97a';
  for (const c of state.coins) circle(ctx, c.x, c.y, 5);
  // Smoke clouds: soft grey discs.
  for (const s of state.smokes) {
    ctx.fillStyle = 'rgba(180, 185, 200, 0.35)';
    circle(ctx, s.x, s.y, 62);
    ctx.fillStyle = 'rgba(210, 215, 228, 0.3)';
    circle(ctx, s.x - 18, s.y + 10, 34);
    circle(ctx, s.x + 20, s.y - 8, 30);
  }
  // Vault crack progress: a brass bar under the vault door.
  if (state.player.crackProgress > 0 && !state.player.vaultCracked) {
    const w = 90;
    const x = VAULT_DOOR.crackX - w / 2;
    const y = VAULT_DOOR.crackY + 30;
    ctx.fillStyle = 'rgba(8, 10, 22, 0.8)';
    ctx.fillRect(x - 2, y - 2, w + 4, 12);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x, y, w * state.player.crackProgress, 8);
  }
  // Red wash while the alarm is high.
  if (state.alarm > 70) {
    const pulse = 0.05 + 0.05 * Math.sin(state.time * 6);
    ctx.fillStyle = `rgba(229, 72, 77, ${pulse})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}

// The whole world, one frame. `state` carries player, guards, cameras,
// loot, coins, smokes, alarm and time.
export function render(ctx, state) {
  drawFloor(ctx);
  drawLoot(ctx, state.player.loot);
  drawVaultDoor(ctx, state.player.vaultCracked);
  drawExit(ctx, state.player.loot.length >= 3);
  drawWalls(ctx);
  drawFurniture(ctx);
  drawCameras(ctx, state.cameras);
  drawGuards(ctx, state.guards);
  drawPlayer(ctx, state.player, state.time);
  drawEffects(ctx, state);
}
