let audio: AudioContext | null = null

export function playAlert(): void {
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
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)

    const tone = (freq: number, at: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + at)
      osc.connect(gain)
      osc.start(now + at)
      osc.stop(now + at + 0.22)
    }
    tone(880, 0)
    tone(660, 0.26)
    navigator.vibrate?.([180, 70, 180])
  } catch {
    /* звук не обязателен для работы таймера */
  }
}
