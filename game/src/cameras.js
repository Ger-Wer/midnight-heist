// cameras.js: wall cameras with sweeping vision cones.
// A camera sits on a wall and sweeps its cone back and forth. It spots the
// thief faster than a guard does, but an EMP blinds it for a while and smoke
// blocks its view just like a guard's.

import { CAMERA, ALARM } from './config.js';
import { CAMERAS } from './level.js';
import { blockedSight, inSmoke } from './guards.js';
import { inShadow } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function makeCameras() {
  return CAMERAS.map((c) => ({
    x: c.x,
    y: c.y,
    baseAngle: c.baseAngle,
    phase: c.phase,
    angle: c.baseAngle,
    blindLeft: 0, // seconds left of EMP blindness
    seen: false,
  }));
}

// One camera, one step. Returns the alarm rise this camera causes.
export function stepCamera(c, dt, time, player, smokes) {
  if (c.blindLeft > 0) {
    c.blindLeft -= dt;
    c.seen = false;
    return 0;
  }
  c.angle = c.baseAngle + Math.sin(time * CAMERA.sweepSpeed + c.phase) * CAMERA.sweepRange;
  const pd = Math.hypot(player.x - c.x, player.y - c.y);
  c.seen = false;
  if (pd < CAMERA.viewLength) {
    const toPlayer = Math.atan2(player.y - c.y, player.x - c.x);
    if (Math.abs(angleDiff(toPlayer, c.angle)) < CAMERA.viewHalfAngle) {
      if (!blockedSight(c.x, c.y, player.x, player.y) && !inSmoke(player.x, player.y, smokes)) {
        c.seen = true;
        const closeness = 1 - pd / CAMERA.viewLength;
        let rate = ALARM.cameraRate * (0.5 + 0.5 * closeness);
        if (inShadow(player.x, player.y)) rate *= ALARM.shadowSeenScale;
        return rate;
      }
    }
  }
  return 0;
}

// EMP: every camera goes blind for TOOLS.empSeconds.
export function blindCameras(cameras, seconds) {
  for (const c of cameras) c.blindLeft = Math.max(c.blindLeft, seconds);
}
