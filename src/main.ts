import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene.ts'
import { UIScene } from './scenes/UIScene.ts'
import { GameOverScene } from './scenes/GameOverScene.ts'
import { WORLD } from './config/units.ts'
import './style.css'

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: WORLD.width,
  height: WORLD.height,
  backgroundColor: '#87ceeb',
  pixelArt: true,
  scene: [GameScene, UIScene, GameOverScene],
})
