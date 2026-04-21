import { ECONOMY } from '../config/units.ts'
import type { PlayerId } from '../config/units.ts'

export class EconomySystem {
  coins: Record<PlayerId, number>
  lastIncomeAt: number
  onChange?: (playerId: PlayerId, coins: number, delta: number) => void

  constructor() {
    this.coins = { 1: ECONOMY.startingCoins, 2: ECONOMY.startingCoins }
    this.lastIncomeAt = 0
  }

  update(time: number): void {
    if (time - this.lastIncomeAt >= ECONOMY.incomeIntervalMs) {
      this.lastIncomeAt = time
      this.coins[1] += ECONOMY.incomePerTick
      this.coins[2] += ECONOMY.incomePerTick
      this.onChange?.(1, this.coins[1], ECONOMY.incomePerTick)
      this.onChange?.(2, this.coins[2], ECONOMY.incomePerTick)
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
