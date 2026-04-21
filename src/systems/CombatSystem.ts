import Phaser from 'phaser'
import type { Soldier } from '../entities/Soldier.ts'
import type { Castle } from '../entities/Castle.ts'
import type { PlayerId } from '../config/units.ts'
import { CASTLE, WORLD } from '../config/units.ts'
import { audio } from './AudioSystem.ts'

export class CombatSystem {
  scene: Phaser.Scene
  soldiers: Soldier[]
  castles: Record<PlayerId, Castle>
  onCastleDestroyed?: (winner: PlayerId) => void
  onSoldierKilled?: (killerId: PlayerId, reward: number) => void

  constructor(scene: Phaser.Scene, castles: Record<PlayerId, Castle>) {
    this.scene = scene
    this.soldiers = []
    this.castles = castles
  }

  addSoldier(soldier: Soldier): void {
    this.soldiers.push(soldier)
  }

  update(time: number, deltaMs: number): void {
    const dt = deltaMs / 1000

    for (const soldier of this.soldiers) {
      if (!soldier.alive) continue
      const enemyCastle = this.castles[soldier.playerId === 1 ? 2 : 1]
      const target = this.findNearestEnemy(soldier)
      const distanceToTarget = target ? Math.abs(target.x - soldier.x) : Infinity
      const distanceToCastle = Math.abs(enemyCastle.frontX - soldier.x)

      if (target && distanceToTarget <= soldier.stats.range) {
        if (soldier.canAttack(time)) {
          this.performAttack(soldier, target)
          soldier.markAttacked(time)
        }
      } else if (enemyCastle.isAlive && distanceToCastle <= soldier.stats.range) {
        if (soldier.canAttack(time)) {
          enemyCastle.takeDamage(soldier.stats.damage, time)
          soldier.markAttacked(time)
          if (!enemyCastle.isAlive) {
            this.onCastleDestroyed?.(soldier.playerId)
          }
        }
      } else {
        soldier.moveBy(soldier.direction * soldier.stats.speed * dt)
      }
    }

    this.updateCastleDefense(time)
    this.soldiers = this.soldiers.filter((s) => s.alive)
  }

  updateCastleDefense(time: number): void {
    for (const id of [1, 2] as PlayerId[]) {
      const castle = this.castles[id]
      if (!castle.isUnderThreat(time) || !castle.canAttack(time)) continue
      const target = this.findNearestEnemyForCastle(castle)
      if (!target) continue
      const dist = Math.abs(target.x - castle.x)
      if (dist > CASTLE.attackRange) continue
      this.castlePerformAttack(castle, target)
      castle.lastAttackAt = time
    }
  }

  findNearestEnemyForCastle(castle: Castle): Soldier | null {
    let closest: Soldier | null = null
    let closestDist = Infinity
    for (const s of this.soldiers) {
      if (!s.alive || s.playerId === castle.playerId) continue
      const dist = Math.abs(s.x - castle.x)
      if (dist < closestDist) {
        closestDist = dist
        closest = s
      }
    }
    return closest
  }

  castlePerformAttack(castle: Castle, target: Soldier): void {
    const targetDied = target.hp - CASTLE.attackDamage <= 0 && target.alive
    target.takeDamage(CASTLE.attackDamage)
    if (targetDied) {
      const reward = Math.round(target.stats.cost * CASTLE.killRewardRatio)
      this.onSoldierKilled?.(castle.playerId, reward)
    }
    this.scene.sound.play('arrow', { volume: 0.5 })
    const arrow = this.scene.add
      .rectangle(castle.turretX, castle.turretY, 12, 3, 0xfff1a8)
      .setDepth(15)
    this.scene.tweens.add({
      targets: arrow,
      x: target.x,
      y: target.sprite.y - 4,
      duration: 260,
      ease: 'Sine.easeIn',
      onComplete: () => {
        arrow.destroy()
        audio.arrowHit()
      },
    })
  }

  findNearestEnemy(soldier: Soldier): Soldier | null {
    let closest: Soldier | null = null
    let closestDist = Infinity
    for (const other of this.soldiers) {
      if (!other.alive || other.playerId === soldier.playerId) continue
      const forward = (other.x - soldier.x) * soldier.direction
      if (forward < -10) continue
      const dist = Math.abs(other.x - soldier.x)
      if (dist < closestDist) {
        closestDist = dist
        closest = other
      }
    }
    return closest
  }

  performAttack(attacker: Soldier, target: Soldier): void {
    const bonus = attacker.stats.damageBonuses?.[target.type] ?? 1
    const damage = Math.round(attacker.stats.damage * bonus)
    const targetDied = target.hp - damage <= 0 && target.alive
    target.takeDamage(damage)
    if (targetDied) {
      const reward = Math.round(target.stats.cost * CASTLE.killRewardRatio)
      this.onSoldierKilled?.(attacker.playerId, reward)
    }
    if (attacker.stats.melee) {
      if (attacker.type === 'knight') this.scene.sound.play('sword', { volume: 0.6 })
      else audio.meleeHit()
      return
    }
    if (attacker.type === 'dragon') this.scene.sound.play('dragon-fire', { volume: 0.6 })
    else this.scene.sound.play('arrow', { volume: 0.5 })
    const arrow = this.scene.add.rectangle(
      attacker.x,
      attacker.sprite.y - 4,
      10,
      2,
      0xeeeeee,
    )
    this.scene.tweens.add({
      targets: arrow,
      x: target.x,
      duration: 180,
      onComplete: () => {
        arrow.destroy()
        audio.arrowHit()
      },
    })
  }

  get groundY(): number {
    return WORLD.groundY
  }
}
