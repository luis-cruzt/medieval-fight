import Phaser from 'phaser'
import { PLAYER_COLORS, WORLD } from '../config/units.ts'
import type { PlayerId } from '../config/units.ts'

interface GameOverData {
  winner: PlayerId
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene')
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(0x1a1a2a)
    const centerX = WORLD.width / 2
    const centerY = WORLD.height / 2

    this.add
      .text(centerX, centerY - 60, `Player ${data.winner} Wins!`, {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#' + PLAYER_COLORS[data.winner].toString(16).padStart(6, '0'),
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)

    this.add
      .text(centerX, centerY + 20, 'Press SPACE for menu', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('MenuScene'))
  }
}
