let audio: AudioContext | null = null
let loop: ReturnType<typeof setInterval> | null = null

function beep(): void {
  const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return
  try {
    audio ??= new Context()
    const ctx = audio
    void ctx.resume()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)

    const tone = (freq: number, at: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + at)
      osc.connect(gain)
      osc.start(now + at)
      osc.stop(now + at + 0.16)
    }
    tone(880, 0)
    tone(660, 0.18)
    navigator.vibrate?.([160, 60, 160])
  } catch {
    /* звук не обязателен для работы таймера */
  }
}

/** Один сигнал. Цикл, пока алерт не подтверждён, включает setAlertLoop. */
export function playAlert(): void {
  beep()
}

/** Повторяет сигнал, пока открыт хотя бы один алерт. Повторный вызов не накладывает второй цикл. */
export function setAlertLoop(active: boolean): void {
  if (!active) {
    if (loop != null) {
      clearInterval(loop)
      loop = null
    }
    return
  }
  if (loop != null) return
  beep()
  loop = setInterval(beep, 1400)
}
