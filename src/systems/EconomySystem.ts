import { ECONOMY } from '../config/units.ts'
import type { PlayerId } from '../config/units.ts'

export class EconomySystem {
  coins: Record<PlayerId, number>
  lastIncomeAt: Record<PlayerId, number>
  intervalMs: Record<PlayerId, number>
  onChange?: (playerId: PlayerId, coins: number, delta: number) => void

  constructor(incomeMultipliers: Partial<Record<PlayerId, number>> = {}) {
    this.coins = { 1: ECONOMY.startingCoins, 2: ECONOMY.startingCoins }
    this.lastIncomeAt = { 1: 0, 2: 0 }
    this.intervalMs = {
      1: ECONOMY.incomeIntervalMs / (incomeMultipliers[1] ?? 1),
      2: ECONOMY.incomeIntervalMs / (incomeMultipliers[2] ?? 1),
    }
  }

  update(time: number): void {
    for (const id of [1, 2] as PlayerId[]) {
      if (time - this.lastIncomeAt[id] >= this.intervalMs[id]) {
        this.lastIncomeAt[id] = time
        this.coins[id] += ECONOMY.incomePerTick
        this.onChange?.(id, this.coins[id], ECONOMY.incomePerTick)
      }
    }
  }

  canAfford(playerId: PlayerId, cost: number): boolean {
    return this.coins[playerId] >= cost
  }

  spend(playerId: PlayerId, cost: number): boolean {
    if (!this.canAfford(playerId, cost)) return false
    this.coins[playerId] -= cost
    this.onChange?.(playerId, this.coins[playerId], -cost)
    return true
  }

  grant(playerId: PlayerId, amount: number): void {
    this.coins[playerId] += amount
    this.onChange?.(playerId, this.coins[playerId], amount)
  }
}
