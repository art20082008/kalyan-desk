import { useHistory } from '../../store/historyStore'
import { useApp } from '../../store/context'
import { Analytics } from './Analytics'
import { RequestList } from './RequestList'

export function HistorySection() {
  const history = useHistory()
  const app = useApp()
  return (
    <div className="history-layout">
      <div className="orders">
        <div>
          <h2 className="page-title">История заявок</h2>
          <p className="page-lead">Заявки свёрнуты до даты и числа вкусов. Нажмите на строку, чтобы увидеть список.</p>
        </div>
        <RequestList requests={history.requests} />
      </div>
      <Analytics
        top={history.top}
        brands={history.brands}
        ended={history.ended}
        smoking={history.smoking}
        live={app.data.hookahs}
        shifts={history.shifts}
        now={app.now}
        onExport={() => {
          void history.exportAnalytics()
        }}
      />
    </div>
  )
}
