import Phaser from 'phaser'
import { CASTLE, PLAYER_COLORS, WORLD } from '../config/units.ts'
import type { PlayerId } from '../config/units.ts'
import { audio } from '../systems/AudioSystem.ts'

const HP_BAR_WIDTH = 160
const HP_BAR_HEIGHT = 12
const CASTLE_EMBED = 4

export class Castle {
  scene: Phaser.Scene
  playerId: PlayerId
  x: number
  y: number
  hp: number
  maxHp: number
  lastDamagedAt: number
  lastAttackAt: number
  sprite: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  banner: Phaser.GameObjects.Rectangle
  hpBarBorder: Phaser.GameObjects.Rectangle
  hpBarBg: Phaser.GameObjects.Rectangle
  hpBar: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, playerId: PlayerId) {
    this.scene = scene
    this.playerId = playerId
    this.x = playerId === 1 ? WORLD.castleP1X : WORLD.castleP2X
    this.y = WORLD.groundY - CASTLE.height / 2 + CASTLE_EMBED
    this.hp = CASTLE.hp
    this.maxHp = CASTLE.hp
    this.lastDamagedAt = -Infinity
    this.lastAttackAt = 0

    this.shadow = scene.add
      .ellipse(this.x, WORLD.groundY + 6, CASTLE.width * 0.85, 10, 0x000000, 0.5)
      .setDepth(-5)

    this.sprite = scene.add
      .image(this.x, this.y, 'castle')
      .setDisplaySize(CASTLE.width, CASTLE.height)
      .setDepth(5)
    if (playerId === 2) this.sprite.setFlipX(true)

    this.banner = scene.add
      .rectangle(
        this.x,
        this.y - CASTLE.height / 2 + 30,
        10,
        20,
        PLAYER_COLORS[playerId],
      )
      .setDepth(6)

    const barY = this.y - CASTLE.height / 2 - 20
    this.hpBarBorder = scene.add
      .rectangle(this.x, barY, HP_BAR_WIDTH + 4, HP_BAR_HEIGHT + 4, 0x000000, 0.85)
      .setStrokeStyle(2, 0x000000)
      .setDepth(20)
    this.hpBarBg = scene.add
      .rectangle(this.x, barY, HP_BAR_WIDTH, HP_BAR_HEIGHT, 0x1a1a1a)
      .setDepth(21)
    this.hpBar = scene.add
      .rectangle(this.x, barY, HP_BAR_WIDTH, HP_BAR_HEIGHT, 0x4caf50)
      .setDepth(22)
  }

  get isAlive(): boolean {
    return this.hp > 0
  }

  takeDamage(amount: number, time: number): void {
    this.hp = Math.max(0, this.hp - amount)
    this.lastDamagedAt = time
    const ratio = this.hp / this.maxHp
    this.hpBar.width = HP_BAR_WIDTH * ratio
    this.hpBar.x = this.x - (HP_BAR_WIDTH * (1 - ratio)) / 2
    this.hpBar.fillColor = ratio > 0.5 ? 0x4caf50 : ratio > 0.25 ? 0xffb300 : 0xd32f2f
    this.scene.cameras.main.shake(80, 0.003)
    audio.castleHit()
  }

  isUnderThreat(time: number): boolean {
    return this.isAlive && time - this.lastDamagedAt < CASTLE.threatCooldownMs
  }

  canAttack(time: number): boolean {
    return time - this.lastAttackAt >= CASTLE.attackCooldownMs
  }

  get turretX(): number {
    return this.playerId === 1 ? this.x + CASTLE.width * 0.12 : this.x - CASTLE.width * 0.12
  }

  get turretY(): number {
    return this.y - CASTLE.height / 2 + 20
  }

  showCoinGain(amount: number): void {
    const txt = this.scene.add
      .text(this.x, this.y - CASTLE.height / 2 - 40, `+${amount}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1)
      .setDepth(30)
    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 32,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    })
  }

  get frontX(): number {
    return this.playerId === 1 ? this.x + CASTLE.width / 2 : this.x - CASTLE.width / 2
  }

  get gateX(): number {
    return this.playerId === 1 ? this.x + CASTLE.width * 0.35 : this.x - CASTLE.width * 0.35
  }
}
