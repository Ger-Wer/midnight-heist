// guards.js: patrols, vision cones and the alarm they raise.
// A guard walks its waypoint loop. When the thief stands inside its vision
// cone with a clear line of sight, the alarm climbs — faster up close, half
// as fast when the thief is in shadow. A thrown coin sends a nearby guard to
// investigate the sound; a high alarm makes guards hurry toward the thief.

import { GUARD, ALARM, TOOLS } from './config.js';
import { GUARDS, solidRects, inShadow } from './level.js';

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Does the segment (x1,y1)-(x2,y2) cross any solid rectangle? Used for
// line of sight: walls and desks block a guard's eyes.
export function blockedSight(x1, y1, x2, y2) {
  for (const r of solidRects()) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Liang-Barsky clipping: the segment enters the rectangle when the
  // parameter interval [t0, t1] overlaps [0, 1].
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// Move a circle (x, y, radius) by (dx, dy) without entering solid rects.
// The move is split into steps of at most 4 px, so a fast circle can never
// jump clean over a thin wall in a single frame (tunnelling).
export function moveCircle(x, y, radius, dx, dy) {
  const rects = solidRects();
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
  let cx = x;
  let cy = y;
  for (let i = 0; i < steps; i++) {
    const sx = dx / steps;
    const sy = dy / steps;
    let nx = cx + sx;
    for (const r of rects) {
      if (nx + radius > r.x && nx - radius < r.x + r.w && cy + radius > r.y && cy - radius < r.y + r.h) {
        nx = sx > 0 ? r.x - radius : r.x + r.w + radius;
      }
    }
    cx = nx;
    let ny = cy + sy;
    for (const r of rects) {
      if (cx + radius > r.x && cx - radius < r.x + r.w && ny + radius > r.y && ny - radius < r.y + r.h) {
        ny = sy > 0 ? r.y - radius : r.y + r.h + radius;
      }
    }
    cy = ny;
  }
  return { x: cx, y: cy };
}

export function makeGuards() {
  return GUARDS.map((g, i) => {
    const start = g.waypoints[g.startIndex];
    const next = g.waypoints[(g.startIndex + 1) % g.waypoints.length];
    return {
      name: g.name,
      waypoints: g.waypoints,
      targetIndex: (g.startIndex + 1) % g.waypoints.length,
      x: start.x,
      y: start.y,
      angle: Math.atan2(next.y - start.y, next.x - start.x),
      state: 'patrol', // patrol | investigate | chase
      investigateX: 0,
      investigateY: 0,
      investigateLeft: 0,
      seen: false,
    };
  });
}

// One guard, one step. Returns the alarm rise this guard causes (0 if blind).
export function stepGuard(g, dt, player, smokes) {
  const speed = g.state === 'chase' ? GUARD.chaseSpeed : GUARD.patrolSpeed;
  let tx;
  let ty;
  if (g.state === 'investigate') {
    tx = g.investigateX;
    ty = g.investigateY;
  } else if (g.state === 'chase') {
    tx = player.x;
    ty = player.y;
  } else {
    const wp = g.waypoints[g.targetIndex];
    tx = wp.x;
    ty = wp.y;
  }
  const d = dist(g.x, g.y, tx, ty);
  if (d > 2) {
    const step = Math.min(speed * dt, d);
    const nx = g.x + ((tx - g.x) / d) * step;
    const ny = g.y + ((ty - g.y) / d) * step;
    const moved = moveCircle(g.x, g.y, GUARD.radius, nx - g.x, ny - g.y);
    g.x = moved.x;
    g.y = moved.y;
    g.angle = Math.atan2(ty - g.y, tx - g.x);
    if (g.state === 'patrol' && dist(g.x, g.y, tx, ty) < 4) {
      g.targetIndex = (g.targetIndex + 1) % g.waypoints.length;
    }
  }
  if (g.state === 'investigate') {
    g.investigateLeft -= dt;
    if (g.investigateLeft <= 0 && dist(g.x, g.y, g.investigateX, g.investigateY) < 14) {
      g.state = 'patrol';
    }
  }

  // Vision: inside the cone, in range, line of sight clear, not behind smoke.
  const pd = dist(g.x, g.y, player.x, player.y);
  g.seen = false;
  if (pd < GUARD.viewLength) {
    const toPlayer = Math.atan2(player.y - g.y, player.x - g.x);
    if (Math.abs(angleDiff(toPlayer, g.angle)) < GUARD.viewHalfAngle) {
      if (!blockedSight(g.x, g.y, player.x, player.y) && !inSmoke(player.x, player.y, smokes)) {
        g.seen = true;
        const closeness = 1 - pd / GUARD.viewLength;
        let rate = ALARM.guardRate * (0.45 + 0.55 * closeness);
        if (inShadow(player.x, player.y)) rate *= ALARM.shadowSeenScale;
        return rate;
      }
    }
  }
  return 0;
}

export function inSmoke(x, y, smokes) {
  for (const s of smokes) {
    if (dist(x, y, s.x, s.y) < TOOLS.smokeRadius) return true;
  }
  return false;
}

// A coin landed at (x, y): guards in earshot walk over to look.
export function distractGuards(guards, x, y) {
  for (const g of guards) {
    if (dist(g.x, g.y, x, y) < TOOLS.coinRange && g.state !== 'chase') {
      g.state = 'investigate';
      g.investigateX = x;
      g.investigateY = y;
      g.investigateLeft = TOOLS.coinInvestigate;
    }
  }
}

// When the alarm is high, guards stop patrolling and hunt the thief.
export function setChase(guards, on) {
  for (const g of guards) {
    if (on && g.state === 'patrol') g.state = 'chase';
    if (!on && g.state === 'chase') g.state = 'patrol';
  }
}
