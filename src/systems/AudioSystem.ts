type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle'

interface Tone {
  wave: Wave
  freqStart: number
  freqEnd?: number
  duration: number
  gain?: number
  noise?: boolean
}

export class AudioSystem {
  ctx: AudioContext | null = null
  muted = false

  ensureContext(): AudioContext {
    if (!this.ctx) {
      const AC: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private playTone(t: Tone): void {
    if (this.muted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(t.gain ?? 0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.duration)
    gain.connect(ctx.destination)

    if (t.noise) {
      const bufferSize = Math.floor(ctx.sampleRate * t.duration)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(t.freqStart, now)
      if (t.freqEnd != null) filter.frequency.exponentialRampToValueAtTime(t.freqEnd, now + t.duration)
      src.connect(filter).connect(gain)
      src.start(now)
      src.stop(now + t.duration)
    } else {
      const osc = ctx.createOscillator()
      osc.type = t.wave
      osc.frequency.setValueAtTime(t.freqStart, now)
      if (t.freqEnd != null) osc.frequency.exponentialRampToValueAtTime(t.freqEnd, now + t.duration)
      osc.connect(gain)
      osc.start(now)
      osc.stop(now + t.duration)
    }
  }

  meleeHit(): void {
    this.playTone({ wave: 'square', freqStart: 180, freqEnd: 60, duration: 0.12, gain: 0.18 })
    this.playTone({ noise: true, wave: 'sine', freqStart: 2800, freqEnd: 400, duration: 0.08, gain: 0.12 })
  }

  arrowRelease(): void {
    this.playTone({ noise: true, wave: 'sine', freqStart: 4200, freqEnd: 1800, duration: 0.08, gain: 0.1 })
    this.playTone({ wave: 'triangle', freqStart: 900, freqEnd: 500, duration: 0.1, gain: 0.08 })
  }

  arrowHit(): void {
    this.playTone({ noise: true, wave: 'sine', freqStart: 1500, freqEnd: 200, duration: 0.08, gain: 0.14 })
  }

  dragonAttack(): void {
    this.playTone({ wave: 'sawtooth', freqStart: 260, freqEnd: 80, duration: 0.3, gain: 0.2 })
    this.playTone({ noise: true, wave: 'sine', freqStart: 900, freqEnd: 200, duration: 0.28, gain: 0.15 })
  }

  unitDeath(): void {
    this.playTone({ wave: 'triangle', freqStart: 400, freqEnd: 90, duration: 0.35, gain: 0.15 })
  }

  castleHit(): void {
    this.playTone({ wave: 'square', freqStart: 120, freqEnd: 40, duration: 0.2, gain: 0.22 })
    this.playTone({ noise: true, wave: 'sine', freqStart: 800, freqEnd: 100, duration: 0.15, gain: 0.18 })
  }

  coinGain(): void {
    this.playTone({ wave: 'square', freqStart: 1200, duration: 0.06, gain: 0.08 })
    this.playTone({ wave: 'square', freqStart: 1800, duration: 0.06, gain: 0.08 })
  }
}

export const audio = new AudioSystem()
