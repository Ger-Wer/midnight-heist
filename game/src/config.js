// The Velvet Vault — a top-down stealth heist in a bank at night.
// config.js: every number the game runs on, in one place.

export const VIEW = { width: 960, height: 600 };

export const PLAYER = {
  radius: 10,
  speed: 165, // px per second
  color: '#e8c15a',
  outline: '#7a5c14',
};

export const GUARD = {
  radius: 11,
  patrolSpeed: 72,
  chaseSpeed: 118,
  viewLength: 165,
  viewHalfAngle: 0.61, // ~35 degrees
  color: '#3b6ea5',
  outline: '#16324f',
  coneColor: 'rgba(255, 214, 90, 0.20)',
  coneEdge: 'rgba(255, 214, 90, 0.45)',
};

export const CAMERA = {
  viewLength: 185,
  viewHalfAngle: 0.42, // ~24 degrees
  sweepSpeed: 0.55, // radians per second
  sweepRange: 0.85, // radians either side of base angle
  color: '#8a93a6',
  coneColor: 'rgba(255, 90, 90, 0.16)',
  coneEdge: 'rgba(255, 90, 90, 0.40)',
};

export const ALARM = {
  guardRate: 26, // per second, at point blank; scales with closeness
  cameraRate: 34,
  decay: 9, // per second while unseen
  shadowDecay: 18, // per second while unseen and standing in shadow
  shadowSeenScale: 0.5, // detection is half as fast while in shadow
  caughtAt: 100,
  ghostLimit: 25, // stay under this for the Ghost bonus
};

export const TOOLS = {
  coins: 3,
  smoke: 2,
  emp: 1,
  coinRange: 210, // guards inside this hear a thrown coin
  coinInvestigate: 3.2, // seconds a guard walks to the coin
  smokeRadius: 78,
  smokeSeconds: 5,
  empSeconds: 10,
};

export const VAULT = {
  crackSeconds: 3, // hold F beside the vault door
  value: 10000,
};

export const LOOT = {
  // id, name, value, position, kind drawn on the floor
  items: [
    { id: 'gold', name: 'Gold bars', value: 5000, x: 880, y: 140, kind: 'bars' },
    { id: 'cash', name: 'Cash bundles', value: 2000, x: 300, y: 300, kind: 'cash' },
    { id: 'diamond', name: 'Blue diamond', value: 8000, x: 726, y: 428, kind: 'gem' },
  ],
  needToWin: 3, // loot pieces (vault counts as one) needed before the exit opens
};

export const GAME = {
  timeLimit: 240, // seconds on the clock
  ghostBonus: 2000,
  timeBonusPerSecond: 10,
  startX: 66,
  startY: 540,
  exitX: 908,
  exitY: 548,
  exitRadius: 26,
};

// Colors of the night bank: deep blue floor, warm light pools, marble and brass.
export const PALETTE = {
  floor: '#141a2e',
  floorTile: '#182036',
  wall: '#2c3a5e',
  wallTop: '#42548a',
  carpet: '#232c4a',
  desk: '#4a3823',
  deskTop: '#6b5233',
  plant: '#1e4d2b',
  shadow: 'rgba(6, 8, 18, 0.55)',
  lightPool: 'rgba(255, 214, 130, 0.05)',
  vaultDoor: '#5d6b82',
  vaultRing: '#c9a227',
  exitGlow: '#37d67a',
  hudBg: 'rgba(8, 10, 22, 0.82)',
  hudText: '#e8e4d2',
  alarmLow: '#37d67a',
  alarmMid: '#e8c15a',
  alarmHigh: '#e5484d',
};
