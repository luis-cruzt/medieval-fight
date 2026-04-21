import Phaser from 'phaser'
import { Castle } from '../entities/Castle.ts'
import { Peasant } from '../entities/Peasant.ts'
import { Knight } from '../entities/Knight.ts'
import { Archer } from '../entities/Archer.ts'
import { Cavalry } from '../entities/Cavalry.ts'
import { Dragon } from '../entities/Dragon.ts'
import { Soldier } from '../entities/Soldier.ts'
import { EconomySystem } from '../systems/EconomySystem.ts'
import { CombatSystem } from '../systems/CombatSystem.ts'
import { AIController, DIFFICULTY_PROFILES } from '../systems/AIController.ts'
import { UNITS, WORLD } from '../config/units.ts'
import type { Difficulty, GameMode, PlayerId, UnitType } from '../config/units.ts'

const ANIMATED_UNITS: UnitType[] = ['peasant', 'knight', 'archer', 'cavalry', 'dragon']

interface GameSceneData {
  mode?: GameMode
  difficulty?: Difficulty
}

export class GameScene extends Phaser.Scene {
  economy!: EconomySystem
  combat!: CombatSystem
  castles!: Record<PlayerId, Castle>
  keys!: Record<string, Phaser.Input.Keyboard.Key>
  gameOver = false
  mode: GameMode = '2p'
  difficulty: Difficulty = 'medium'
  ai: AIController | null = null

  constructor() {
    super('GameScene')
  }

  init(data: GameSceneData): void {
    this.mode = data.mode ?? '2p'
    this.difficulty = data.difficulty ?? 'medium'
  }

  preload(): void {
    this.load.image('background', '/sprites/background.png')
    this.load.image('castle', '/sprites/castle-archer.png')
    this.load.audio('sword', '/sword.mp3')
    this.load.audio('arrow', '/arrow.mp3')
    this.load.audio('bg-music', '/bg-music.mp3')
    this.load.audio('dragon-roar', '/dragon-roar.mp3')
    this.load.audio('dragon-fire', '/dragon-fire.mp3')
    for (const type of ANIMATED_UNITS) {
      const stats = UNITS[type]
      this.loadAnimFrames(type, 'walk', stats.walkFrames)
      this.loadAnimFrames(type, 'attack', stats.attackFrames)
      this.loadAnimFrames(type, 'die', stats.dieFrames)
    }
  }

  loadAnimFrames(type: UnitType, anim: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const n = i.toString().padStart(3, '0')
      this.load.image(`${type}-${anim}-${i}`, `/sprites/${type}/${anim}/frame_${n}.png`)
    }
  }

  create(): void {
    this.gameOver = false
    this.drawBackground()
    this.drawGround()
    this.registerUnitAnimations()
    this.startBackgroundMusic()

    this.castles = {
      1: new Castle(this, 1),
      2: new Castle(this, 2),
    }

    const multipliers: Partial<Record<PlayerId, number>> = {}
    if (this.mode === '1p') {
      multipliers[2] = DIFFICULTY_PROFILES[this.difficulty].incomeMultiplier
    }
    this.economy = new EconomySystem(multipliers)
    this.combat = new CombatSystem(this, this.castles)
    this.combat.onCastleDestroyed = (winner) => this.endGame(winner)
    this.combat.onSoldierKilled = (killerId, reward) => {
      this.economy.grant(killerId, reward)
    }
    this.economy.onChange = (playerId, _coins, delta) => {
      if (delta > 0) this.castles[playerId].showCoinGain(delta)
    }

    const kb = this.input.keyboard!
    this.keys = {
      p1Peasant: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      p1Knight: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      p1Archer: kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      p1Cavalry: kb.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      p1Dragon: kb.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      p2Peasant: kb.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      p2Knight: kb.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      p2Archer: kb.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      p2Cavalry: kb.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      p2Dragon: kb.addKey(Phaser.Input.Keyboard.KeyCodes.K),
    }

    kb.on('keydown-Q', () => this.trySpawn(1, 'peasant'))
    kb.on('keydown-W', () => this.trySpawn(1, 'knight'))
    kb.on('keydown-E', () => this.trySpawn(1, 'archer'))
    kb.on('keydown-T', () => this.trySpawn(1, 'cavalry'))
    kb.on('keydown-R', () => this.trySpawn(1, 'dragon'))
    if (this.mode === '2p') {
      kb.on('keydown-I', () => this.trySpawn(2, 'peasant'))
      kb.on('keydown-O', () => this.trySpawn(2, 'knight'))
      kb.on('keydown-P', () => this.trySpawn(2, 'archer'))
      kb.on('keydown-L', () => this.trySpawn(2, 'cavalry'))
      kb.on('keydown-K', () => this.trySpawn(2, 'dragon'))
    } else {
      this.ai = new AIController(this, 2, this.difficulty)
    }

    this.scene.launch('UIScene', { gameScene: this })
  }

  trySpawn(playerId: PlayerId, type: UnitType): void {
    if (this.gameOver) return
    const stats = UNITS[type]
    if (!this.economy.spend(playerId, stats.cost)) return

    const castle = this.castles[playerId]
    const spawnX = castle.gateX

    let soldier: Soldier
    if (type === 'peasant') soldier = new Peasant(this, playerId, spawnX)
    else if (type === 'knight') soldier = new Knight(this, playerId, spawnX)
    else if (type === 'archer') soldier = new Archer(this, playerId, spawnX)
    else if (type === 'cavalry') soldier = new Cavalry(this, playerId, spawnX)
    else soldier = new Dragon(this, playerId, spawnX)

    if (type === 'dragon') this.sound.play('dragon-roar', { volume: 0.7 })
    this.combat.addSoldier(soldier)
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return
    this.economy.update(time)
    this.combat.update(time, delta)
    this.ai?.update(time)
  }

  registerUnitAnimations(): void {
    for (const type of ANIMATED_UNITS) {
      const stats = UNITS[type]
      this.registerAnim(type, 'walk', stats.walkFrames, 12, -1)
      this.registerAnim(type, 'attack', stats.attackFrames, 14, 0)
      this.registerAnim(type, 'die', stats.dieFrames, 10, 0)
    }
  }

  registerAnim(type: UnitType, anim: string, count: number, frameRate: number, repeat: number): void {
    const key = `${type}-${anim}`
    if (this.anims.exists(key)) return
    const frames: Phaser.Types.Animations.AnimationFrame[] = []
    for (let i = 0; i < count; i++) frames.push({ key: `${type}-${anim}-${i}` })
    this.anims.create({ key, frames, frameRate, repeat })
  }

  drawBackground(): void {
    this.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(WORLD.width, WORLD.groundY)
      .setDepth(-100)
  }


  drawGround(): void {
    const g = this.add.graphics()
    g.setDepth(-50)
    const grassH = 18
    g.fillStyle(0x2d5a1b, 1)
    g.fillRect(0, WORLD.groundY, WORLD.width, grassH)
    g.fillStyle(0x3a7128, 1)
    for (let x = 0; x < WORLD.width; x += 8) {
      const h = ((x * 37) % 5) + 2
      g.fillRect(x, WORLD.groundY - 1, 4, h)
    }
    g.fillStyle(0x5c3317, 1)
    g.fillRect(0, WORLD.groundY + grassH, WORLD.width, WORLD.height - WORLD.groundY - grassH)
    g.fillStyle(0x3d1f08, 0.55)
    const rng = Phaser.Math.RND
    rng.sow(['castle-siege-dirt'])
    for (let i = 0; i < 120; i++) {
      const x = rng.between(0, WORLD.width)
      const y = rng.between(WORLD.groundY + grassH + 4, WORLD.height - 4)
      g.fillRect(x, y, 3, 3)
    }
  }

  startBackgroundMusic(): void {
    const music = this.sound.add('bg-music', { loop: true, volume: 0.25 })
    const tryPlay = (): void => {
      if (music.isPlaying) return
      music.play()
    }
    tryPlay()
    this.input.keyboard?.once('keydown', tryPlay)
    this.input.once('pointerdown', tryPlay)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => music.stop())
  }

  endGame(winner: PlayerId): void {
    if (this.gameOver) return
    this.gameOver = true
    this.scene.stop('UIScene')
    this.scene.start('GameOverScene', { winner })
  }
}
