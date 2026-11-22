// Midnight Heist — level geometry: collision and line of sight.
// A circle (thief or guard) collides with rects; a sight ray is blocked
// by walls, pillars and crates, but NOT by display cases (glass).

import { WALLS, BLOCKERS, CASES } from './config.js';

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function solidRects() {
  return WALLS.concat(BLOCKERS).concat(CASES);
}

export function sightBlockers() {
  return WALLS.concat(BLOCKERS);
}

// Move a circle by (dx, dy), sliding along rects. Returns the new pos.
export function moveCircle(pos, dx, dy, r) {
  const solids = solidRects();
  let nx = pos.x + dx;
  if (solids.some((rc) => circleHitsRect(nx, pos.y, r, rc))) nx = pos.x;
  let ny = pos.y + dy;
  if (solids.some((rc) => circleHitsRect(nx, ny, r, rc))) ny = pos.y;
  return { x: nx, y: ny };
}

function segmentHitsRect(x1, y1, x2, y2, rc) {
  // Liang-Barsky clip of the segment against the rect.
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rc.x, rc.x + rc.w - x1, y1 - rc.y, rc.y + rc.h - y1];
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

// True when nothing blocks the view between two points.
export function hasLineOfSight(x1, y1, x2, y2) {
  const blockers = sightBlockers();
  for (const rc of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, rc)) return false;
  }
  return true;
}

export function inRect(x, y, rc) {
  return x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h;
}

export function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}
