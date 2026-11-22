// level.js: the bank floor — walls, furniture, shadows, patrol routes, cameras.
// One screen, 960x600: the whole floor is visible at once, no scrolling.
// Coordinates are pixels in the 960x600 view. Walls are rectangles; the player
// and the guards collide with them as circles. Shadow zones are dark floor
// rectangles where the alarm falls twice as fast and eyes are half as sharp.

export const WALLS = [
  // Outer shell (thick border walls)
  { x: 0, y: 0, w: 960, h: 14 }, // top
  { x: 0, y: 586, w: 960, h: 14 }, // bottom
  { x: 0, y: 0, w: 14, h: 600 }, // left
  { x: 946, y: 0, w: 14, h: 600 }, // right
  // Vault room (top right): walls with a single door gap on its left side
  { x: 700, y: 14, w: 246, h: 12 }, // vault room top (under outer wall)
  { x: 700, y: 14, w: 12, h: 120 }, // vault room left wall, upper part
  { x: 700, y: 196, w: 12, h: 62 }, // vault room left wall, lower part (door gap 134..196)
  { x: 700, y: 258, w: 246, h: 12 }, // vault room bottom
  // Manager's office (bottom right): walls with a door gap on top (x 780..860)
  { x: 640, y: 380, w: 140, h: 12 }, // office top wall, left of the door
  { x: 860, y: 380, w: 86, h: 12 }, // office top wall, right of the door
  { x: 640, y: 380, w: 12, h: 206 }, // office left wall
  // Teller row (middle): a long counter the thief must walk around
  { x: 220, y: 330, w: 240, h: 18 },
  { x: 220, y: 330, w: 18, h: 0 },
  // Pillar row near the lobby
  { x: 420, y: 120, w: 26, h: 26 },
  { x: 420, y: 430, w: 26, h: 26 },
];

// Furniture: desks, plants, rugs — visual cover and collision blocks.
export const FURNITURE = [
  { kind: 'desk', x: 250, y: 250, w: 120, h: 44 },
  { kind: 'desk', x: 250, y: 420, w: 120, h: 44 },
  { kind: 'desk', x: 520, y: 150, w: 110, h: 40 },
  { kind: 'plant', x: 60, y: 60, w: 30, h: 30 },
  { kind: 'plant', x: 880, y: 320, w: 30, h: 30 },
  { kind: 'plant', x: 660, y: 480, w: 30, h: 30 },
  { kind: 'rug', x: 440, y: 280, w: 150, h: 90 },
];

// Shadow zones: dark patches (behind desks, under the stairs) where the
// thief is harder to spot and the alarm cools down faster.
export const SHADOWS = [
  { x: 30, y: 470, w: 110, h: 100 },
  { x: 240, y: 220, w: 140, h: 70 },
  { x: 480, y: 470, w: 120, h: 100 },
  { x: 760, y: 300, w: 110, h: 60 },
];

// The vault: a big round door standing in the vault room. Its centre sits
// low enough (y 76) that the top HUD bar never covers it.
export const VAULT_DOOR = { x: 838, y: 76, radius: 34, crackX: 838, crackY: 128 };

// Guards: patrol waypoints (loops) and where they start. Every route is drawn
// to stay clear of walls and furniture, so a guard never has to push through one.
export const GUARDS = [
  {
    name: 'Marco',
    waypoints: [
      { x: 120, y: 90 },
      { x: 400, y: 90 },
      { x: 400, y: 180 },
      { x: 120, y: 180 },
    ],
    startIndex: 0,
  },
  {
    name: 'Dana',
    waypoints: [
      { x: 170, y: 300 },
      { x: 170, y: 520 },
      { x: 560, y: 520 },
      { x: 560, y: 300 },
    ],
    startIndex: 1,
  },
  {
    name: 'Viktor',
    waypoints: [
      { x: 500, y: 140 },
      { x: 500, y: 240 },
      { x: 380, y: 240 },
      { x: 380, y: 140 },
    ],
    startIndex: 2,
  },
];

// Wall cameras: fixed mounts, sweeping cones.
export const CAMERAS = [
  { x: 480, y: 42, baseAngle: Math.PI / 2, phase: 0 }, // top wall, sweeps the lobby
  { x: 938, y: 300, baseAngle: Math.PI, phase: 1.6 }, // right wall, sweeps the vault approach
];

// Light pools: warm circles on the floor, purely visual.
export const LIGHTS = [
  { x: 200, y: 160, r: 130 },
  { x: 560, y: 180, r: 140 },
  { x: 800, y: 430, r: 130 },
  { x: 300, y: 480, r: 120 },
];

// Collision shapes: walls plus the solid furniture (desks, plants).
export function solidRects() {
  const rects = WALLS.filter((w) => w.w > 0 && w.h > 0);
  for (const f of FURNITURE) {
    if (f.kind === 'desk' || f.kind === 'plant') rects.push({ x: f.x, y: f.y, w: f.w, h: f.h });
  }
  return rects;
}

// True when point (x, y) stands inside any shadow zone.
export function inShadow(x, y) {
  for (const s of SHADOWS) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}
