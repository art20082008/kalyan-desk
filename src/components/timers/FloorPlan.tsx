import { useRef } from 'react'
import type { Hookah } from '../../types'
import { openAlerts } from '../../domain/timers'

export function buildSamplePlan(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 1400
  canvas.height = 900
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#141414'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#ffffff1a'
  ctx.lineWidth = 8
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96)
  ctx.fillStyle = '#a1a1a1'
  ctx.font = '500 28px Roboto, sans-serif'
  ctx.fillText('Зал Малевич', 80, 110)
  const tables = [
    [180, 220],
    [520, 220],
    [860, 220],
    [180, 520],
    [520, 520],
    [860, 520],
  ]
  tables.forEach(([x, y], index) => {
    ctx.fillStyle = '#232323'
    ctx.strokeStyle = '#856353'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(x, y, 240, 150, 16)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = '500 32px Roboto, sans-serif'
    ctx.fillText(`Стол ${index + 1}`, x + 58, y + 86)
  })
  return canvas.toDataURL('image/jpeg', 0.86)
}

export function FloorPlan({
  imageUrl,
  fileName,
  hookahs,
  now,
  onUpload,
  onSample,
  onClear,
  onPlace,
  onOpen,
  onMove,
}: {
  imageUrl: string | null
  fileName: string | null
  hookahs: Hookah[]
  now: number
  onUpload: () => void
  onSample: () => void
  onClear: () => void
  onPlace: (x: number, y: number) => void
  onOpen: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)

  if (!imageUrl) {
    return (
      <section className="plan empty-plan">
        <h3>План зала</h3>
        <p>Загрузите JPEG посадки. Клик по плану ставит кальян, на одном столе их может быть несколько.</p>
        <div className="row wrap">
          <button type="button" className="btn primary" onClick={onUpload}>
            Загрузить JPEG
          </button>
          <button type="button" className="btn" onClick={onSample}>
            Пример плана
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="plan">
      <header className="plan-head">
        <div>
          <h3>План зала</h3>
          <p className="muted">{fileName ?? 'JPEG'} · клик ставит кальян, точку можно перетащить</p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={onUpload}>
            Заменить
          </button>
          <button type="button" className="btn ghost" onClick={onClear}>
            Убрать
          </button>
        </div>
      </header>
      <div className="plan-frame">
        <div
          className="plan-stage"
          ref={stageRef}
          data-noswipe
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('.pin')) return
            const bounds = stageRef.current?.getBoundingClientRect()
            if (!bounds || bounds.width === 0 || bounds.height === 0) return
            const x = ((event.clientX - bounds.left) / bounds.width) * 100
            const y = ((event.clientY - bounds.top) / bounds.height) * 100
            if (x < 0 || y < 0 || x > 100 || y > 100) return
            onPlace(Math.round(x * 10) / 10, Math.round(y * 10) / 10)
          }}
        >
          <img src={imageUrl} alt="План посадки зала" />
          {hookahs
            .filter((hookah) => hookah.x != null && hookah.y != null)
            .map((hookah) => {
              const alerting = openAlerts(hookah, now).length > 0
              return (
                <button
                  key={hookah.id}
                  type="button"
                  className={alerting ? 'pin alerting' : 'pin'}
                  style={{ left: `${hookah.x}%`, top: `${hookah.y}%` }}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (event.currentTarget.dataset.skip === '1') {
                      delete event.currentTarget.dataset.skip
                      return
                    }
                    onOpen(hookah.id)
                  }}
                  onPointerDown={(event) => {
                    const pin = event.currentTarget
                    const startX = event.clientX
                    const startY = event.clientY
                    const originX = hookah.x ?? 0
                    const originY = hookah.y ?? 0
                    let moved = false
                    const move = (ev: PointerEvent) => {
                      const bounds = stageRef.current?.getBoundingClientRect()
                      if (!bounds || bounds.width === 0) return
                      const dx = ((ev.clientX - startX) / bounds.width) * 100
                      const dy = ((ev.clientY - startY) / bounds.height) * 100
                      if (Math.abs(dx) + Math.abs(dy) > 1.2) moved = true
                      const x = Math.min(100, Math.max(0, Math.round((originX + dx) * 10) / 10))
                      const y = Math.min(100, Math.max(0, Math.round((originY + dy) * 10) / 10))
                      pin.style.left = `${x}%`
                      pin.style.top = `${y}%`
                      pin.dataset.x = String(x)
                      pin.dataset.y = String(y)
                    }
                    const up = () => {
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                      if (moved && pin.dataset.x && pin.dataset.y) {
                        pin.dataset.skip = '1'
                        onMove(hookah.id, Number(pin.dataset.x), Number(pin.dataset.y))
                      }
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  }}
                >
                  <span>{hookah.table}</span>
                </button>
              )
            })}
        </div>
      </div>
    </section>
  )
}
