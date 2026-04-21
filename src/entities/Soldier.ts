import Phaser from 'phaser'
import { UNITS, WORLD } from '../config/units.ts'
import type { PlayerId, UnitStats, UnitType } from '../config/units.ts'
import { audio } from '../systems/AudioSystem.ts'

type Visual = Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle

export class Soldier {
  scene: Phaser.Scene
  playerId: PlayerId
  type: UnitType
  stats: UnitStats
  direction: 1 | -1
  hp: number
  maxHp: number
  lastAttackAt: number
  sprite: Visual
  shadow: Phaser.GameObjects.Ellipse
  hpBarBg: Phaser.GameObjects.Rectangle
  hpBar: Phaser.GameObjects.Rectangle
  alive: boolean
  usesAnimatedSprite: boolean

  constructor(scene: Phaser.Scene, playerId: PlayerId, type: UnitType, x: number) {
    this.scene = scene
    this.playerId = playerId
    this.type = type
    this.stats = UNITS[type]
    this.direction = playerId === 1 ? 1 : -1
    this.hp = this.stats.hp
    this.maxHp = this.stats.hp
    this.lastAttackAt = 0
    this.alive = true

    const size = this.stats.spriteSize
    const y = WORLD.groundY - size / 2 + this.stats.groundOffset
    this.usesAnimatedSprite = scene.textures.exists(`${type}-walk-0`)

    this.shadow = scene.add
      .ellipse(x, WORLD.groundY + 4, size * 0.45, 7, 0x000000, 0.5)
      .setDepth(9)

    if (this.usesAnimatedSprite) {
      const s = scene.add
        .sprite(x, y, `${type}-walk-0`)
        .setDisplaySize(size, size)
        .setDepth(10)
      if (playerId === 2) s.setFlipX(true)
      s.play(`${type}-walk`)
      this.sprite = s
    } else {
      const r = scene.add
        .rectangle(x, y + size / 2 - this.stats.height / 2, this.stats.width, this.stats.height, this.stats.color)
        .setStrokeStyle(2, playerId === 1 ? 0x1e4a8a : 0x8a1e27)
        .setDepth(10)
      this.sprite = r
    }

    const barY = WORLD.groundY - size - 4 + this.stats.groundOffset
    const barW = Math.max(this.stats.width, 32)
    this.hpBarBg = scene.add.rectangle(x, barY, barW, 4, 0x222222).setDepth(15)
    this.hpBar = scene.add.rectangle(x, barY, barW, 4, 0x4caf50).setDepth(16)
  }

  get x(): number {
    return this.sprite.x
  }

  moveBy(dx: number): void {
    this.sprite.x += dx
    this.shadow.x += dx
    this.hpBarBg.x += dx
    this.hpBar.x += dx
  }

  takeDamage(amount: number): void {
    if (!this.alive) return
    this.hp = Math.max(0, this.hp - amount)
    const ratio = this.hp / this.maxHp
    this.hpBar.width = this.hpBarBg.width * ratio
    this.hpBar.fillColor = ratio > 0.5 ? 0x4caf50 : ratio > 0.25 ? 0xffb300 : 0xd32f2f
    this.showDamageNumber(amount)
    this.flashDamage()
    if (this.hp <= 0) this.kill()
  }

  showDamageNumber(amount: number): void {
    const t = this.scene.add
      .text(this.sprite.x, this.hpBarBg.y - 8, `-${amount}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ff5252',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1)
      .setDepth(50)
    const jitterX = Phaser.Math.Between(-8, 8)
    this.scene.tweens.add({
      targets: t,
      x: t.x + jitterX,
      y: t.y - 28,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    })
  }

  flashDamage(): void {
    if (this.usesAnimatedSprite) {
      const s = this.sprite as Phaser.GameObjects.Sprite
      s.setTint(0xff4040)
      this.scene.time.delayedCall(100, () => {
        if (s.active) s.clearTint()
      })
    }
  }

  canAttack(time: number): boolean {
    return time - this.lastAttackAt >= this.stats.attackCooldownMs
  }

  markAttacked(time: number): void {
    this.lastAttackAt = time
    if (this.usesAnimatedSprite) {
      const s = this.sprite as Phaser.GameObjects.Sprite
      s.play(`${this.type}-attack`)
      s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.alive) s.play(`${this.type}-walk`)
      })
    } else {
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.2,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
      })
    }
  }

  kill(): void {
    if (!this.alive) return
    this.alive = false
    audio.unitDeath()
    this.hpBar.destroy()
    this.hpBarBg.destroy()
    const fadeShadow = () => {
      this.scene.tweens.add({
        targets: this.shadow,
        alpha: 0,
        duration: 300,
        onComplete: () => this.shadow.destroy(),
      })
    }
    const hasDieAnim = this.usesAnimatedSprite && this.stats.dieFrames > 0
    if (hasDieAnim) {
      const s = this.sprite as Phaser.GameObjects.Sprite
      s.setTint(0xff3030)
      this.scene.time.delayedCall(120, () => {
        if (s.active) s.clearTint()
      })
      s.play(`${this.type}-die`)
      s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        fadeShadow()
        this.scene.tweens.add({
          targets: s,
          alpha: 0,
          duration: 300,
          onComplete: () => s.destroy(),
        })
      })
    } else {
      if ('setFillStyle' in this.sprite) {
        ;(this.sprite as Phaser.GameObjects.Rectangle).setFillStyle(0xff3030)
      }
      fadeShadow()
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 300,
        onComplete: () => this.sprite.destroy(),
      })
    }
  }
}
