import Phaser from 'phaser'
import type { GameScene } from './GameScene.ts'
import { UNITS, WORLD } from '../config/units.ts'
import type { PlayerId, UnitType } from '../config/units.ts'

interface UISceneData {
  gameScene: GameScene
}

const HUD_HEIGHT = 90
const GOLD = '#ffd700'
const P1_ACCENT = 0x3a7bd5
const P2_ACCENT = 0xd5483a

const P1_KEYS: Record<UnitType, string> = {
  peasant: 'Q',
  knight: 'W',
  archer: 'E',
  cavalry: 'T',
  dragon: 'R',
}
const P2_KEYS: Record<UnitType, string> = {
  peasant: 'I',
  knight: 'O',
  archer: 'P',
  cavalry: 'L',
  dragon: 'K',
}
const UNIT_ORDER: UnitType[] = ['peasant', 'knight', 'archer', 'cavalry', 'dragon']

export class UIScene extends Phaser.Scene {
  game1!: GameScene
  coinText!: Record<PlayerId, Phaser.GameObjects.Text>

  constructor() {
    super('UIScene')
  }

  create(data: UISceneData): void {
    this.game1 = data.gameScene

    this.drawHudBar()
    this.coinText = {
      1: this.drawCoinLabel(1),
      2: this.drawCoinLabel(2),
    }
    this.drawUnitPanels()
    this.drawModeLabel()

    this.game1.economy.onChange = (playerId, coins) => this.renderCoins(playerId, coins)
    this.renderCoins(1, this.game1.economy.coins[1])
    this.renderCoins(2, this.game1.economy.coins[2])
  }

  drawHudBar(): void {
    const g = this.add.graphics()
    g.fillStyle(0x000000, 0.7)
    g.fillRect(0, 0, WORLD.width, HUD_HEIGHT)
    g.lineStyle(2, 0xffd700, 0.3)
    g.lineBetween(0, HUD_HEIGHT, WORLD.width, HUD_HEIGHT)
  }

  drawCoinLabel(playerId: PlayerId): Phaser.GameObjects.Text {
    const isLeft = playerId === 1
    const accent = isLeft ? P1_ACCENT : P2_ACCENT
    const x = isLeft ? 20 : WORLD.width - 20

    const tagText = this.add
      .text(x, 10, `P${playerId}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: this.hex(accent),
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold',
      })
      .setOrigin(isLeft ? 0 : 1, 0)

    return this.add
      .text(x, tagText.y + tagText.height + 2, '0c', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: GOLD,
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold',
      })
      .setOrigin(isLeft ? 0 : 1, 0)
  }

  drawUnitPanels(): void {
    const panelW = 90
    const panelH = 60
    const gap = 6
    const totalW = panelW * UNIT_ORDER.length + gap * (UNIT_ORDER.length - 1)
    const p1StartX = 120
    const p2StartX = WORLD.width - 120 - totalW
    const y = 18

    UNIT_ORDER.forEach((type, i) => {
      this.drawPanel(1, type, p1StartX + i * (panelW + gap), y, panelW, panelH)
      this.drawPanel(2, type, p2StartX + i * (panelW + gap), y, panelW, panelH)
    })
  }

  drawPanel(playerId: PlayerId, type: UnitType, x: number, y: number, w: number, h: number): void {
    const stats = UNITS[type]
    const accent = playerId === 1 ? P1_ACCENT : P2_ACCENT
    const isCpu = playerId === 2 && this.game1.mode === '1p'
    const key = isCpu ? 'CPU' : playerId === 1 ? P1_KEYS[type] : P2_KEYS[type]
    const interactive = !isCpu

    const panel = this.add
      .rectangle(x + w / 2, y + h / 2, w, h, 0x1a1a2e, 0.9)
      .setStrokeStyle(2, accent)

    if (interactive) {
      panel.setInteractive({ useHandCursor: true })
      panel.on('pointerover', () => panel.setFillStyle(0x2a2a44, 0.95))
      panel.on('pointerout', () => {
        panel.setFillStyle(0x1a1a2e, 0.9)
        panel.setScale(1)
      })
      panel.on('pointerdown', () => {
        panel.setScale(0.95)
        this.game1.trySpawn(playerId, type)
      })
      panel.on('pointerup', () => panel.setScale(1))
    } else {
      panel.setAlpha(0.6)
    }

    this.add
      .text(x + 8, y + 6, isCpu ? key : `[${key}]`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.hex(accent),
        fontStyle: 'bold',
      })
      .setOrigin(0, 0)

    this.add
      .text(x + w / 2, y + 26, type, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)

    this.add
      .text(x + w / 2, y + 42, `${stats.cost}c`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: GOLD,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
  }

  renderCoins(playerId: PlayerId, coins: number): void {
    this.coinText[playerId].setText(`${coins}c`)
  }

  drawModeLabel(): void {
    const label =
      this.game1.mode === '1p'
        ? `1P — ${this.game1.difficulty.toUpperCase()}`
        : '2 PLAYERS'
    this.add
      .text(WORLD.width / 2, 10, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: GOLD,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
  }

  hex(n: number): string {
    return '#' + n.toString(16).padStart(6, '0')
  }
}
