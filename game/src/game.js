// Midnight Heist — simulation: the thief, three patrolling guards, two
// sweeping cameras, the alarm meter, loot, the safe, and the tools.
// A guard that spots the thief walks toward the last seen position;
// cameras sweep on a fixed rhythm. Everything is deterministic: the
// same inputs always produce the same outcome.

import {
  WORLD, TIMER_SECONDS, WIN_LOOT_MIN, THIEF_SPEED, THIEF_RADIUS,
  GUARD_SPEED, GUARD_RADIUS, GUARD_CONE_LEN, GUARD_CONE_HALF,
  CAMERA_CONE_LEN, CAMERA_CONE_HALF, ALARM_MAX, ALARM_DECAY,
  ALARM_GUARD_CLOSE, ALARM_GUARD_FAR, ALARM_CAMERA, ALARM_SHADOW_FACTOR,
  ALARM_WARN_AT, SAFE_CRACK_SECONDS, SAFE_CRACK_RADIUS, COIN_RANGE,
  COIN_INVESTIGATE_SECONDS, SMOKE_RADIUS, SMOKE_SECONDS, EMP_SECONDS,
  COIN_THROW_SPEED, LOOT, LOOT_SPOTS, SAFE, ENTRY, EXIT, GUARDS, CAMERAS,
  SHADOWS, TOOL_START,
} from './config.js';
import { moveCircle, hasLineOfSight, inRect, dist } from './level.js';

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function pointSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function createGame() {
  const state = {
    status: 'title', // title | playing | caught | won | timeout
    time: 0,
    timeLeft: TIMER_SECONDS,
    thief: { x: ENTRY.x, y: ENTRY.y, angle: -Math.PI / 2 },
    guards: GUARDS.map((g) => {
      const wp = g.waypoints[g.start];
      const next = g.waypoints[(g.start + 1) % g.waypoints.length];
      return {
        name: g.name,
        x: wp.x,
        y: wp.y,
        angle: angleTo(wp.x, wp.y, next.x, next.y),
        waypoints: g.waypoints,
        wpIndex: (g.start + 1) % g.waypoints.length,
        mode: 'patrol',
        pause: 0,
        investigate: null,
        investigateTimer: 0,
        seen: false,
      };
    }),
    cameras: CAMERAS.map((c) => ({ ...c, angle: c.baseAngle, offUntil: 0 })),
    alarm: 0,
    alarmWarn: false,
    loot: { diamond: false, painting: false, vase: false, safe: false },
    safeProgress: 0,
    tools: { ...TOOL_START },
    coins: [], // in flight: {x, y, tx, ty}
    smokes: [], // {x, y, until}
    message: '',
    messageUntil: 0,
    score: 0,
    ghost: false,
    paused: false,
  };

  function lootCount() {
    return Object.values(state.loot).filter(Boolean).length;
  }

  function lootValue() {
    return Object.entries(state.loot)
      .filter(([, got]) => got)
      .reduce((sum, [id]) => sum + LOOT[id].value, 0);
  }

  function thiefInShadow() {
    return SHADOWS.some((s) => inRect(state.thief.x, state.thief.y, s));
  }

  function thiefHiddenBySmoke(x, y) {
    return state.smokes.some((s) => dist(x, y, s.x, s.y) < SMOKE_RADIUS);
  }

  function sightBlockedBySmoke(x1, y1, x2, y2) {
    return state.smokes.some(
      (s) => pointSegmentDist(s.x, s.y, x1, y1, x2, y2) < SMOKE_RADIUS,
    );
  }

  function guardSeesThief(g) {
    const t = state.thief;
    const d = dist(g.x, g.y, t.x, t.y);
    if (d > GUARD_CONE_LEN) return 0;
    const a = angleTo(g.x, g.y, t.x, t.y);
    if (Math.abs(angleDiff(a, g.angle)) > GUARD_CONE_HALF) return 0;
    if (thiefHiddenBySmoke(t.x, t.y)) return 0;
    if (sightBlockedBySmoke(g.x, g.y, t.x, t.y)) return 0;
    if (!hasLineOfSight(g.x, g.y, t.x, t.y)) return 0;
    return d < 110 ? ALARM_GUARD_CLOSE : ALARM_GUARD_FAR;
  }

  function cameraSeesThief(c) {
    if (state.time < c.offUntil) return 0;
    const t = state.thief;
    const d = dist(c.x, c.y, t.x, t.y);
    if (d > CAMERA_CONE_LEN) return 0;
    const a = angleTo(c.x, c.y, t.x, t.y);
    if (Math.abs(angleDiff(a, c.angle)) > CAMERA_CONE_HALF) return 0;
    if (thiefHiddenBySmoke(t.x, t.y)) return 0;
    if (sightBlockedBySmoke(c.x, c.y, t.x, t.y)) return 0;
    if (!hasLineOfSight(c.x, c.y, t.x, t.y)) return 0;
    return ALARM_CAMERA;
  }

  function stepGuard(g, dt) {
    const t = state.thief;
    if (g.mode === 'investigate' && g.investigate) {
      const d = dist(g.x, g.y, g.investigate.x, g.investigate.y);
      if (d < 14) {
        g.investigateTimer -= dt;
        g.angle += dt * 0.9; // look around while searching
        if (g.investigateTimer <= 0) {
          g.mode = 'patrol';
          g.investigate = null;
        }
        return;
      }
      const a = angleTo(g.x, g.y, g.investigate.x, g.investigate.y);
      g.angle = a;
      const nx = g.x + Math.cos(a) * GUARD_SPEED * 1.25 * dt;
      const ny = g.y + Math.sin(a) * GUARD_SPEED * 1.25 * dt;
      const p = moveCircle(g, nx - g.x, ny - g.y, GUARD_RADIUS);
      g.x = p.x;
      g.y = p.y;
      return;
    }
    // patrol
    if (g.pause > 0) {
      g.pause -= dt;
      g.angle += dt * 0.7;
      return;
    }
    const wp = g.waypoints[g.wpIndex];
    const d = dist(g.x, g.y, wp.x, wp.y);
    if (d < 10) {
      g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
      g.pause = 0.8;
      return;
    }
    const a = angleTo(g.x, g.y, wp.x, wp.y);
    g.angle = a;
    const nx = g.x + Math.cos(a) * GUARD_SPEED * dt;
    const ny = g.y + Math.sin(a) * GUARD_SPEED * dt;
    const p = moveCircle(g, nx - g.x, ny - g.y, GUARD_RADIUS);
    g.x = p.x;
    g.y = p.y;
  }

  function flash(msg, seconds = 2.5) {
    state.message = msg;
    state.messageUntil = state.time + seconds;
  }

  return {
    state,

    start() {
      state.status = 'playing';
      state.time = 0;
      state.timeLeft = TIMER_SECONDS;
    },

    update(dt, input, audio) {
      if (state.status !== 'playing' || state.paused) return;
      state.time += dt;
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.status = 'timeout';
        audio.caught();
        return;
      }

      // --- thief movement ---
      const mv = input.moveVector();
      if (mv.x !== 0 || mv.y !== 0) {
        const nx = state.thief.x + mv.x * THIEF_SPEED * dt;
        const ny = state.thief.y + mv.y * THIEF_SPEED * dt;
        const p = moveCircle(state.thief, nx - state.thief.x, ny - state.thief.y, THIEF_RADIUS);
        state.thief.x = p.x;
        state.thief.y = p.y;
        state.thief.angle = Math.atan2(mv.y, mv.x);
      }

      // --- one-shot actions ---
      for (const act of input.drainActions()) {
        if (typeof act === 'string') {
          if (act === 'smoke' && state.tools.smoke > 0) {
            state.tools.smoke -= 1;
            state.smokes.push({ x: state.thief.x, y: state.thief.y, until: state.time + SMOKE_SECONDS });
            audio.smoke();
            flash('Smoke out — they cannot see through it');
          } else if (act === 'emp' && state.tools.emp > 0) {
            state.tools.emp -= 1;
            for (const c of state.cameras) c.offUntil = state.time + EMP_SECONDS;
            audio.emp();
            flash('EMP! Cameras blind for 10 seconds');
          }
        } else if (act.type === 'coin' && state.tools.coins > 0) {
          const d = dist(state.thief.x, state.thief.y, act.x, act.y);
          const tx = d > COIN_RANGE
            ? state.thief.x + ((act.x - state.thief.x) / d) * COIN_RANGE
            : act.x;
          const ty = d > COIN_RANGE
            ? state.thief.y + ((act.y - state.thief.y) / d) * COIN_RANGE
            : act.y;
          state.tools.coins -= 1;
          state.coins.push({ x: state.thief.x, y: state.thief.y, tx, ty });
          audio.coin();
        }
      }

      // --- thrown coins land and distract ---
      for (let i = state.coins.length - 1; i >= 0; i--) {
        const c = state.coins[i];
        const d = dist(c.x, c.y, c.tx, c.ty);
        const step = COIN_THROW_SPEED * dt;
        if (d <= step) {
          state.coins.splice(i, 1);
          for (const g of state.guards) {
            if (dist(g.x, g.y, c.tx, c.ty) < 280) {
              g.mode = 'investigate';
              g.investigate = { x: c.tx, y: c.ty };
              g.investigateTimer = COIN_INVESTIGATE_SECONDS;
            }
          }
          flash('Clink! A guard heard that');
        } else {
          c.x += ((c.tx - c.x) / d) * step;
          c.y += ((c.ty - c.y) / d) * step;
        }
      }

      // --- smoke clouds expire ---
      state.smokes = state.smokes.filter((s) => state.time < s.until);

      // --- loot pickup ---
      for (const spot of LOOT_SPOTS) {
        if (!state.loot[spot.id] && dist(state.thief.x, state.thief.y, spot.x, spot.y) < 30) {
          state.loot[spot.id] = true;
          audio.pickup();
          flash(`${LOOT[spot.id].label} taken — $${LOOT[spot.id].value}`);
        }
      }

      // --- safe cracking: hold F near the safe ---
      const nearSafe = dist(state.thief.x, state.thief.y, SAFE.x, SAFE.y) < SAFE_CRACK_RADIUS + 10;
      if (!state.loot.safe && nearSafe && input.holdingF()) {
        state.safeProgress += dt;
        if (Math.floor(state.safeProgress * 2) !== Math.floor((state.safeProgress - dt) * 2)) {
          audio.crackTick();
        }
        if (state.safeProgress >= SAFE_CRACK_SECONDS) {
          state.loot.safe = true;
          state.safeProgress = 0;
          audio.pickup();
          flash('Safe open — $400 in cash');
        }
      } else if (state.safeProgress > 0) {
        state.safeProgress = Math.max(0, state.safeProgress - dt * 2);
      }

      // --- cameras sweep ---
      for (const c of state.cameras) {
        c.angle = c.baseAngle + c.sweep * Math.sin((2 * Math.PI * state.time) / c.period);
      }

      // --- guards move and watch ---
      let seenRate = 0;
      const shadow = thiefInShadow();
      for (const g of state.guards) {
        const rate = guardSeesThief(g);
        g.seen = rate > 0;
        if (rate > 0) {
          seenRate = Math.max(seenRate, rate);
          g.mode = 'investigate';
          g.investigate = { x: state.thief.x, y: state.thief.y };
          g.investigateTimer = COIN_INVESTIGATE_SECONDS;
        }
        stepGuard(g, dt);
      }
      for (const c of state.cameras) {
        const rate = cameraSeesThief(c);
        if (rate > 0) seenRate = Math.max(seenRate, rate);
      }

      // --- alarm ---
      if (seenRate > 0) {
        state.alarm += seenRate * (shadow ? ALARM_SHADOW_FACTOR : 1) * dt;
      } else {
        state.alarm -= ALARM_DECAY * dt;
      }
      state.alarm = Math.max(0, Math.min(ALARM_MAX, state.alarm));
      state.alarmWarn = state.alarm >= ALARM_WARN_AT;
      audio.alarmTick(performance.now(), state.alarm);
      if (state.alarm >= ALARM_MAX) {
        state.status = 'caught';
        audio.caught();
        return;
      }

      // --- escape ---
      if (inRect(state.thief.x, state.thief.y, EXIT)) {
        if (lootCount() >= WIN_LOOT_MIN) {
          state.status = 'won';
          state.ghost = state.alarm < 25;
          state.score = lootValue()
            + Math.round(state.timeLeft) * 5
            + (state.ghost ? 200 : 0);
          audio.win();
        } else {
          flash(`Need ${WIN_LOOT_MIN - lootCount()} more item${WIN_LOOT_MIN - lootCount() === 1 ? '' : 's'} before the van`);
        }
      }

      if (state.time > state.messageUntil) state.message = '';
    },

    lootCount,
    lootValue,
    thiefInShadow,
  };
}
