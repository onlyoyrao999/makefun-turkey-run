// Turkey Run: Thanksgiving Escape — tuning constants.
// One place for every number the world, the renderer and the screenshots share.
export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 452; // y of the dirt path's top edge
export const STEP = 1 / 60;

export const TURKEY = {
  x: 150,
  width: 62,
  height: 58,
  duckHeight: 34,
  jumpVelocity: -950,
  doubleJumpVelocity: -800,
  gravity: 2100,
};

export const WORLD = {
  baseSpeed: 265, // px per second at level 1
  speedPerLevel: 26,
  maxSpeed: 560,
  levelEveryMeters: 400,
  pxPerMeter: 50,
  escapeMeters: 1500, // reach the forest and you are free
  startLives: 3,
  startFarmerGap: 280, // px the farmer trails behind the turkey
  farmerCatchGap: 42, // gap at or below this means caught
  farmerMaxGap: 280,
  stumbleGapLoss: 60,
  mudGapLossPerSec: 40,
  cleanGapGainPerSec: 7,
  cornGapBonus: 6,
  goldenGapBonus: 14,
  stumbleSlowSeconds: 0.65,
  stumbleSlowFactor: 0.55,
  invulnerableSeconds: 1.4,
  chiliSeconds: 4,
};

export const SCORE = {
  corn: 10,
  goldenCorn: 50,
  smashBonus: 25,
  meterPoint: 1, // one point per metre travelled
};

export const SPAWN = {
  minGapPx: 250,
  maxGapPx: 520,
  cornChance: 0.62,
  goldenChance: 0.1,
  featherChance: 0.12,
  chiliChance: 0.09,
};

export const COLORS = {
  skyTop: '#7ec8e3',
  skyMid: '#fde8b8',
  skyLow: '#ffb347',
  sun: '#ffd94d',
  hillFar: '#9dbb6e',
  hillNear: '#7da352',
  grass: '#5d8a3c',
  dirt: '#b07a45',
  dirtDark: '#96683a',
  barnRed: '#b3402e',
  barnRoof: '#7c2d20',
  fence: '#8a6a42',
  turkeyBody: '#8a5a2b',
  turkeyBelly: '#c98d4e',
  turkeyHead: '#d97b4f',
  turkeyWattle: '#d9382b',
  turkeyBeak: '#f2a541',
  featherDark: '#5e3d1c',
  featherLight: '#a9713a',
  farmerShirt: '#3e6fb0',
  farmerOveralls: '#2f4d6e',
  farmerSkin: '#e8b98a',
  farmerHat: '#e8c33a',
  corn: '#ffd23e',
  cornHusk: '#5d8a3c',
  knife: '#dfe6ee',
  knifeHandle: '#3a2e22',
  oven: '#4a4a52',
  ovenGlow: '#ff7a2e',
  pumpkin: '#e8721c',
  hay: '#e0b64f',
  mud: '#6b4a2f',
  textDark: '#2b1d12',
  panel: 'rgba(255, 248, 230, 0.94)',
};

export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  CAUGHT: 'caught',
  ESCAPED: 'escaped',
};
