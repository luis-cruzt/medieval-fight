import type Phaser from 'phaser'
import { Soldier } from './Soldier.ts'
import type { PlayerId } from '../config/units.ts'

export class Peasant extends Soldier {
  constructor(scene: Phaser.Scene, playerId: PlayerId, x: number) {
    super(scene, playerId, 'peasant', x)
  }
}
