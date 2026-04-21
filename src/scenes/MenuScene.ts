import Phaser from 'phaser'
import { WORLD } from '../config/units.ts'
import type { Difficulty, GameMode } from '../config/units.ts'

const GOLD = '#ffd700'
const WHITE = '#ffffff'

export class MenuScene extends Phaser.Scene {
  step: 'mode' | 'difficulty' = 'mode'
  widgets: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super('MenuScene')
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1a1a2a)
    this.renderTitle()
    this.renderModeStep()
  }

  renderTitle(): void {
    this.add
      .text(WORLD.width / 2, 120, 'CASTLE SIEGE', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: GOLD,
        stroke: '#000000',
        strokeThickness: 8,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
  }

  renderModeStep(): void {
    this.clearWidgets()
    this.widgets.push(this.label(WORLD.width / 2, 240, 'SELECT MODE', '24px', WHITE))
    this.widgets.push(this.button(WORLD.width / 2, 320, '1 PLAYER (vs CPU)', () => this.onMode('1p')))
    this.widgets.push(this.button(WORLD.width / 2, 400, '2 PLAYERS (local)', () => this.onMode('2p')))
  }

  renderDifficultyStep(): void {
    this.clearWidgets()
    this.widgets.push(this.label(WORLD.width / 2, 240, 'SELECT DIFFICULTY', '24px', WHITE))
    this.widgets.push(this.button(WORLD.width / 2, 310, 'EASY', () => this.onDifficulty('easy')))
    this.widgets.push(this.button(WORLD.width / 2, 380, 'MEDIUM', () => this.onDifficulty('medium')))
    this.widgets.push(this.button(WORLD.width / 2, 450, 'HARD', () => this.onDifficulty('hard')))
    this.widgets.push(
      this.button(WORLD.width / 2, 530, '< BACK', () => this.renderModeStep(), 16, 0x444444),
    )
  }

  onMode(mode: GameMode): void {
    if (mode === '2p') {
      this.startGame('2p', 'medium')
      return
    }
    this.step = 'difficulty'
    this.renderDifficultyStep()
  }

  onDifficulty(difficulty: Difficulty): void {
    this.startGame('1p', difficulty)
  }

  startGame(mode: GameMode, difficulty: Difficulty): void {
    this.scene.start('GameScene', { mode, difficulty })
  }

  label(x: number, y: number, text: string, size: string, color: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: size,
        color,
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
  }

  button(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    fontSize = 22,
    bgColor = 0x2a2a44,
  ): Phaser.GameObjects.Container {
    const w = 360
    const h = 56
    const bg = this.add.rectangle(0, 0, w, h, bgColor, 0.95).setStrokeStyle(2, 0xffd700)
    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: `${fontSize}px`,
        color: WHITE,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
    const container = this.add.container(x, y, [bg, label])
    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerover', () => bg.setFillStyle(0x3a3a5c, 1))
    bg.on('pointerout', () => bg.setFillStyle(bgColor, 0.95))
    bg.on('pointerdown', () => {
      container.setScale(0.97)
      onClick()
    })
    bg.on('pointerup', () => container.setScale(1))
    return container
  }

  clearWidgets(): void {
    this.widgets.forEach((w) => w.destroy())
    this.widgets = []
  }
}
