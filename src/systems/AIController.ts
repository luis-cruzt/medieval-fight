import Phaser from 'phaser'
import type { GameScene } from '../scenes/GameScene.ts'
import type { Soldier } from '../entities/Soldier.ts'
import type { Difficulty, PlayerId, UnitType } from '../config/units.ts'
import { UNITS } from '../config/units.ts'

interface DifficultyProfile {
  tickMs: number
  jitter: number
  startDelayMs: number
  unitCap: number
  saveForDragon: boolean
  reactToThreats: boolean
  randomness: number
  incomeMultiplier: number
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: {
    tickMs: 2500,
    jitter: 0.25,
    startDelayMs: 1500,
    unitCap: 99,
    saveForDragon: false,
    reactToThreats: false,
    randomness: 0.7,
    incomeMultiplier: 1,
  },
  medium: {
    tickMs: 1200,
    jitter: 0.2,
    startDelayMs: 1000,
    unitCap: 8,
    saveForDragon: true,
    reactToThreats: true,
    randomness: 0.2,
    incomeMultiplier: 1,
  },
  hard: {
    tickMs: 600,
    jitter: 0.15,
    startDelayMs: 800,
    unitCap: 99,
    saveForDragon: true,
    reactToThreats: true,
    randomness: 0.05,
    incomeMultiplier: 1.25,
  },
}

const THREAT_WEIGHT: Record<UnitType, number> = {
  peasant: 1,
  archer: 2,
  knight: 4,
  cavalry: 5,
  dragon: 10,
}

const COUNTERS: Record<UnitType, UnitType> = {
  dragon: 'archer',
  knight: 'cavalry',
  cavalry: 'knight',
  archer: 'knight',
  peasant: 'archer',
}

export class AIController {
  scene: GameScene
  playerId: PlayerId
  difficulty: Difficulty
  profile: DifficultyProfile
  nextDecisionAt: number
  rotation: UnitType[] = ['peasant', 'archer', 'knight', 'peasant', 'cavalry']
  rotationIdx = 0

  constructor(scene: GameScene, playerId: PlayerId, difficulty: Difficulty) {
    this.scene = scene
    this.playerId = playerId
    this.difficulty = difficulty
    this.profile = DIFFICULTY_PROFILES[difficulty]
    this.nextDecisionAt = this.profile.startDelayMs
  }

  update(time: number): void {
    if (time < this.nextDecisionAt) return
    this.decide()
    const jit = 1 + (Math.random() * 2 - 1) * this.profile.jitter
    this.nextDecisionAt = time + this.profile.tickMs * jit
  }

  decide(): void {
    const coins = this.scene.economy.coins[this.playerId]
    const myCount = this.countMyUnits()
    if (myCount >= this.profile.unitCap) return

    const enemyUnits = this.getEnemyUnits()
    const want = this.pickUnit(enemyUnits, coins)
    if (!want) return

    const cost = UNITS[want].cost
    if (coins < cost) return

    this.scene.trySpawn(this.playerId, want)
  }

  pickUnit(enemyUnits: Soldier[], coins: number): UnitType | null {
    const affordable = (['peasant', 'archer', 'knight', 'cavalry', 'dragon'] as UnitType[])
      .filter((t) => UNITS[t].cost <= coins)
    if (affordable.length === 0) return null

    if (this.profile.saveForDragon) {
      const enemyHasArcher = enemyUnits.some((s) => s.type === 'archer')
      const dragonCost = UNITS.dragon.cost
      if (!enemyHasArcher && coins >= dragonCost * 0.8 && coins < dragonCost) {
        return null
      }
      if (!enemyHasArcher && coins >= dragonCost) return 'dragon'
    }

    if (this.profile.reactToThreats && enemyUnits.length > 0) {
      const biggestThreat = this.biggestThreat(enemyUnits)
      if (biggestThreat) {
        const counter = COUNTERS[biggestThreat]
        if (affordable.includes(counter)) {
          if (Math.random() > this.profile.randomness) return counter
        }
      }
    }

    if (Math.random() < this.profile.randomness) {
      return Phaser.Math.RND.pick(affordable)
    }

    for (let i = 0; i < this.rotation.length; i++) {
      const type = this.rotation[(this.rotationIdx + i) % this.rotation.length]
      if (affordable.includes(type)) {
        this.rotationIdx = (this.rotationIdx + i + 1) % this.rotation.length
        return type
      }
    }
    return Phaser.Math.RND.pick(affordable)
  }

  biggestThreat(enemyUnits: Soldier[]): UnitType | null {
    let best: UnitType | null = null
    let bestScore = 0
    for (const s of enemyUnits) {
      const w = THREAT_WEIGHT[s.type]
      if (w > bestScore) {
        bestScore = w
        best = s.type
      }
    }
    return best
  }

  countMyUnits(): number {
    return this.scene.combat.soldiers.filter((s) => s.alive && s.playerId === this.playerId).length
  }

  getEnemyUnits(): Soldier[] {
    return this.scene.combat.soldiers.filter((s) => s.alive && s.playerId !== this.playerId)
  }
}
