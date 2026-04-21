export type UnitType = 'peasant' | 'knight' | 'archer' | 'cavalry' | 'dragon'
export type PlayerId = 1 | 2
export type GameMode = '1p' | '2p'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface UnitStats {
  cost: number
  hp: number
  damage: number
  speed: number
  range: number
  attackCooldownMs: number
  width: number
  height: number
  color: number
  melee: boolean
  spriteSize: number
  walkFrames: number
  attackFrames: number
  dieFrames: number
  groundOffset: number
  damageBonuses?: Partial<Record<UnitType, number>>
}

export const UNITS: Record<UnitType, UnitStats> = {
  peasant: {
    cost: 50,
    hp: 80,
    damage: 8,
    speed: 120,
    range: 50,
    attackCooldownMs: 700,
    width: 22,
    height: 38,
    color: 0x8b6b3d,
    melee: true,
    spriteSize: 72,
    walkFrames: 6,
    attackFrames: 6,
    dieFrames: 7,
    groundOffset: 11,
  },
  knight: {
    cost: 150,
    hp: 250,
    damage: 25,
    speed: 80,
    range: 50,
    attackCooldownMs: 1100,
    width: 30,
    height: 48,
    color: 0xb8b8c4,
    melee: true,
    spriteSize: 84,
    walkFrames: 6,
    attackFrames: 6,
    dieFrames: 7,
    groundOffset: 4,
  },
  archer: {
    cost: 100,
    hp: 120,
    damage: 18,
    speed: 90,
    range: 250,
    attackCooldownMs: 1200,
    width: 22,
    height: 38,
    color: 0x2e8b3e,
    melee: false,
    spriteSize: 72,
    walkFrames: 6,
    attackFrames: 7,
    dieFrames: 7,
    groundOffset: 7,
    damageBonuses: { dragon: 2.5 },
  },
  cavalry: {
    cost: 200,
    hp: 180,
    damage: 22,
    speed: 180,
    range: 55,
    attackCooldownMs: 900,
    width: 44,
    height: 44,
    color: 0x7a4a2a,
    melee: true,
    spriteSize: 180,
    walkFrames: 6,
    attackFrames: 8,
    dieFrames: 6,
    groundOffset: 55,
    damageBonuses: { knight: 2.5 },
  },
  dragon: {
    cost: 400,
    hp: 500,
    damage: 60,
    speed: 60,
    range: 180,
    attackCooldownMs: 1500,
    width: 72,
    height: 60,
    color: 0xc02020,
    melee: false,
    spriteSize: 160,
    walkFrames: 6,
    attackFrames: 9,
    dieFrames: 0,
    groundOffset: 31,
  },
}

export const ECONOMY = {
  startingCoins: 1000,
  incomePerTick: 50,
  incomeIntervalMs: 5000,
}

export const CASTLE = {
  hp: 3000,
  width: 224,
  height: 252,
  attackRange: 260,
  attackDamage: 15,
  attackCooldownMs: 1400,
  threatCooldownMs: 2500,
  killRewardRatio: 0.5,
}

export const WORLD = {
  width: 1280,
  height: 600,
  groundY: 500,
  castleP1X: 170,
  castleP2X: 1110,
}

export const PLAYER_COLORS: Record<PlayerId, number> = {
  1: 0x3a7bd5,
  2: 0xd5483a,
}
