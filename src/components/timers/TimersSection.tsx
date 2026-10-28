import { useState } from 'react'
import type { Hookah } from '../../types'
import { isActiveHookah, type HookahDraft } from '../../domain/timers'
import { useTimers } from '../../store/timersStore'
import { useApp } from '../../store/context'
import { Hall } from './Hall'
import { HookahEditor } from './HookahEditor'
import { TimerList } from './TimerList'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function TimersSection() {
  const timers = useTimers()
  const app = useApp()
  const [editor, setEditor] = useState<{ hookah: Hookah | null; table: string | null } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Hookah | null>(null)

  function save(draft: HookahDraft) {
    if (editor?.hookah) timers.save(editor.hookah.id, draft)
    else timers.add(draft)
  }

  return (
    <div className="timers-layout">
      <div className="sessions">
        <div className="title-row">
          <div>
            <h2 className="page-title">Ведение кальянов</h2>
            <p className="page-lead">У каждого стола свои таймер, вкус чаши и алерты. Пробел гасит самый ранний алерт.</p>
          </div>
          <Button variant="primary" onClick={() => setEditor({ hookah: null, table: null })}>
            Добавить кальян
          </Button>
        </div>
        <TimerList
          hookahs={timers.hookahs}
          now={timers.now}
          onAdd={() => setEditor({ hookah: null, table: null })}
          onEdit={(hookah) => setEditor({ hookah, table: null })}
          onDelete={(hookah) => {
            if (isActiveHookah(hookah, timers.now)) setPendingDelete(hookah)
            else timers.remove(hookah.id)
          }}
          onToggle={timers.toggle}
          onFinish={timers.finish}
          onAcknowledge={timers.acknowledge}
        />
      </div>
      <Hall
        tables={app.data.tables}
        hookahs={timers.hookahs}
        now={timers.now}
        onAddTable={timers.addTable}
        onPick={(label) => setEditor({ hookah: null, table: label })}
      />
      {editor ? (
        <HookahEditor
          hookah={editor.hookah}
          table={editor.table}
          defaults={app.data.settings.alertIntervals}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      ) : null}
      {pendingDelete ? (
        <Modal
          title="Кальян активен, удалить?"
          onClose={() => setPendingDelete(null)}
          narrow
          footer={
            <>
              <Button onClick={() => setPendingDelete(null)}>Оставить</Button>
              <Button
                variant="danger"
                onClick={() => {
                  timers.remove(pendingDelete.id)
                  setPendingDelete(null)
                }}
              >
                Удалить
              </Button>
            </>
          }
        >
          <p>
            {pendingDelete.table}, {pendingDelete.kind}. Таймер ещё идёт.
          </p>
        </Modal>
      ) : null}
    </div>
  )
}
