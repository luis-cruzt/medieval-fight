import type Phaser from 'phaser'
import { Soldier } from './Soldier.ts'
import type { PlayerId } from '../config/units.ts'

export class Archer extends Soldier {
  constructor(scene: Phaser.Scene, playerId: PlayerId, x: number) {
    super(scene, playerId, 'archer', x)
  }
}
