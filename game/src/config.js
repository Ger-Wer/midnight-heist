// Midnight Heist — configuration and level layout.
// World is 1280 x 664 px. Walls are rects; the thief, guards and cameras
// all live in this coordinate space. All numbers are chosen by hand for
// this level: a night museum with an entry hall (left), a main gallery
// (centre) and a vault (top right). The getaway van waits at the top
// right door.

export const WORLD = { w: 1280, h: 664 };
export const HUD_H = 56;

export const TIMER_SECONDS = 180;
export const WIN_LOOT_MIN = 3;
export const THIEF_SPEED = 150;
export const THIEF_RADIUS = 12;
export const GUARD_SPEED = 56;
export const GUARD_RADIUS = 12;
export const GUARD_CONE_LEN = 205;
export const GUARD_CONE_HALF = 0.61; // ~35 degrees
export const CAMERA_CONE_LEN = 235;
export const CAMERA_CONE_HALF = 0.52; // ~30 degrees
export const ALARM_MAX = 100;
export const ALARM_CAUGHT_AT = 100;
export const ALARM_DECAY = 10; // per second while hidden
export const ALARM_GUARD_CLOSE = 30; // per second, thief within 110 px
export const ALARM_GUARD_FAR = 16; // per second, thief inside cone
export const ALARM_CAMERA = 40; // per second, thief inside camera cone
export const ALARM_SHADOW_FACTOR = 0.4;
export const ALARM_WARN_AT = 75;
export const SAFE_CRACK_SECONDS = 3;
export const SAFE_CRACK_RADIUS = 46;
export const COIN_RANGE = 280;
export const COIN_INVESTIGATE_SECONDS = 4;
export const SMOKE_RADIUS = 78;
export const SMOKE_SECONDS = 5;
export const EMP_SECONDS = 10;
export const COIN_THROW_SPEED = 520;

export const LOOT = {
  diamond: { value: 500, label: 'Diamond' },
  painting: { value: 300, label: 'Painting' },
  vase: { value: 200, label: 'Vase' },
  safe: { value: 400, label: 'Safe contents' },
};

// Walls: {x, y, w, h}. The outer shell is 16 px thick with two gaps:
// the entry door (bottom wall, x 72..168) and the getaway door
// (top wall, x 1120..1208).
export const WALLS = [
  // outer shell
  { x: 0, y: 0, w: 1120, h: 16 },
  { x: 1208, y: 0, w: 72, h: 16 },
  { x: 0, y: 648, w: 72, h: 16 },
  { x: 168, y: 648, w: 1112, h: 16 },
  { x: 0, y: 0, w: 16, h: 664 },
  { x: 1264, y: 0, w: 16, h: 664 },
  // entry hall / gallery divider, door gap y 268..344
  { x: 420, y: 16, w: 14, h: 252 },
  { x: 420, y: 344, w: 14, h: 220 },
  // gallery / vault divider, door gap y 300..384
  { x: 860, y: 16, w: 14, h: 284 },
  { x: 860, y: 384, w: 14, h: 180 },
  // vault top wall, door gap x 1020..1104
  { x: 874, y: 180, w: 146, h: 14 },
  { x: 1104, y: 180, w: 160, h: 14 },
  // lower corridor wall, door gap x 596..684
  { x: 434, y: 420, w: 162, h: 14 },
  { x: 684, y: 420, w: 176, h: 14 },
];

// Crates and pillars block movement AND sight.
export const BLOCKERS = [
  // pillars in the gallery
  { x: 552, y: 292, w: 56, h: 56, kind: 'pillar' },
  { x: 748, y: 292, w: 56, h: 56, kind: 'pillar' },
  { x: 552, y: 520, w: 56, h: 56, kind: 'pillar' },
  { x: 748, y: 520, w: 56, h: 56, kind: 'pillar' },
  // crates: one stack near the entry, one in the gallery
  { x: 96, y: 420, w: 88, h: 64, kind: 'crate' },
  { x: 640, y: 96, w: 96, h: 56, kind: 'crate' },
  { x: 1000, y: 480, w: 96, h: 64, kind: 'crate' },
];

// Display cases block movement but NOT sight.
export const CASES = [
  { x: 500, y: 120, w: 110, h: 52 },
  { x: 716, y: 120, w: 110, h: 52 },
  { x: 500, y: 592, w: 110, h: 44 },
  { x: 716, y: 592, w: 110, h: 44 },
];

// Shadow zones: standing here makes detection much slower.
export const SHADOWS = [
  { x: 440, y: 560, w: 180, h: 72, label: 'shadow' },
  { x: 80, y: 64, w: 150, h: 84, label: 'shadow' },
  { x: 900, y: 560, w: 150, h: 72, label: 'shadow' },
  { x: 40, y: 556, w: 160, h: 92, label: 'shadow' },
];

export const LOOT_SPOTS = [
  { id: 'vase', x: 210, y: 500, r: 22 },
  { id: 'painting', x: 560, y: 44, r: 22 },
  { id: 'diamond', x: 1168, y: 92, r: 22 },
];

export const SAFE = { x: 1200, y: 140, r: 24 };
export const ENTRY = { x: 120, y: 600 };
export const EXIT = { x: 1120, y: 0, w: 88, h: 34 };

export const GUARDS = [
  {
    name: 'A',
    waypoints: [
      { x: 500, y: 220 },
      { x: 800, y: 220 },
      { x: 800, y: 470 },
      { x: 500, y: 470 },
    ],
    start: 0,
  },
  {
    name: 'B',
    waypoints: [
      { x: 150, y: 200 },
      { x: 330, y: 200 },
      { x: 330, y: 480 },
      { x: 180, y: 480 },
    ],
    start: 2,
  },
  {
    name: 'C',
    waypoints: [
      { x: 950, y: 260 },
      { x: 1180, y: 260 },
      { x: 1180, y: 560 },
      { x: 950, y: 560 },
    ],
    start: 1,
  },
];

export const CAMERAS = [
  { x: 640, y: 20, baseAngle: Math.PI / 2, sweep: 0.8, period: 4.2 },
  { x: 1010, y: 194, baseAngle: Math.PI / 2, sweep: 0.7, period: 5.1 },
];

export const TOOL_START = { coins: 3, smoke: 2, emp: 1 };
