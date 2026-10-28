import { useState } from 'react'
import type { Hookah } from '../../types'
import { storage } from '../../data/localDb'
import { isActiveHookah, type HookahDraft } from '../../domain/timers'
import { useTimers } from '../../store/timersStore'
import { useApp } from '../../store/context'
import { FloorPlan, buildSamplePlan } from './FloorPlan'
import { HookahEditor } from './HookahEditor'
import { TimerList } from './TimerList'
import { Modal } from '../ui/Modal'

interface EditorState {
  hookah: Hookah | null
  point: { x: number; y: number } | null
}

export function TimersSection({ closeSignal }: { closeSignal: number }) {
  const timers = useTimers()
  const app = useApp()
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Hookah | null>(null)
  const [seenClose, setSeenClose] = useState(closeSignal)

  if (seenClose !== closeSignal) {
    setSeenClose(closeSignal)
    setEditor(null)
    setPendingDelete(null)
  }

  async function upload() {
    try {
      const picked = await storage.pickPlan()
      if (!picked) return
      await app.setPlanImage(picked)
      app.showToast('План зала загружен')
    } catch (reason) {
      app.showToast(reason instanceof Error ? reason.message : 'Не удалось загрузить JPEG')
    }
  }

  function save(draft: HookahDraft) {
    if (editor?.hookah) timers.save(editor.hookah.id, draft)
    else timers.add(draft)
  }

  return (
    <div className="section timers-layout">
      <div className="section-head">
        <div>
          <h2>Ведение кальянов</h2>
          <p className="muted">Таймер, вид чаши и алерты у каждого кальяна свои. Пробел гасит самый ранний алерт.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setEditor({ hookah: null, point: null })}>
          Добавить
        </button>
      </div>
      <TimerList
        hookahs={timers.hookahs}
        now={timers.now}
        onAdd={() => setEditor({ hookah: null, point: null })}
        onEdit={(hookah) => setEditor({ hookah, point: null })}
        onDelete={(hookah) => {
          if (isActiveHookah(hookah, timers.now)) setPendingDelete(hookah)
          else timers.remove(hookah.id)
        }}
        onToggle={timers.toggle}
        onFinish={timers.finish}
        onAcknowledge={timers.acknowledge}
      />
      <FloorPlan
        imageUrl={timers.planDataUrl}
        fileName={timers.plan?.fileName ?? null}
        hookahs={timers.hookahs}
        now={timers.now}
        onUpload={() => {
          void upload()
        }}
        onSample={() => {
          const dataUrl = buildSamplePlan()
          void app.setPlanImage({ fileName: 'primer-zala.jpg', dataUrl }).then(() => app.showToast('Открыт пример плана'))
        }}
        onClear={() => {
          void app.setPlanImage(null)
        }}
        onPlace={(x, y) => setEditor({ hookah: null, point: { x, y } })}
        onOpen={(id) => {
          const hookah = timers.hookahs.find((item) => item.id === id)
          if (hookah) setEditor({ hookah, point: null })
        }}
        onMove={timers.movePin}
      />
      {editor ? (
        <HookahEditor hookah={editor.hookah} point={editor.point} onClose={() => setEditor(null)} onSave={save} />
      ) : null}
      {pendingDelete ? (
        <Modal title="Кальян активен, удалить?" onClose={() => setPendingDelete(null)} narrow>
          <p>
            {pendingDelete.table}, {pendingDelete.kind}. Таймер ещё идёт.
          </p>
          <div className="row end">
            <button type="button" className="btn" onClick={() => setPendingDelete(null)}>
              Оставить
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                timers.remove(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Удалить
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
