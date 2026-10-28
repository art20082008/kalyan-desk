import { useHistory } from '../../store/historyStore'
import { Analytics } from './Analytics'
import { RequestList } from './RequestList'

export function HistorySection() {
  const history = useHistory()
  return (
    <div className="section history-layout">
      <div>
        <div className="section-head">
          <div>
            <h2>История</h2>
            <p className="muted">Заявки свёрнуты до даты и числа вкусов. Нажмите строку, чтобы раскрыть список.</p>
          </div>
        </div>
        <RequestList requests={history.requests} />
      </div>
      <Analytics
        top={history.top}
        brands={history.brands}
        ended={history.ended}
        smoking={history.smoking}
        onExport={() => {
          void history.exportAnalytics()
        }}
      />
    </div>
  )
}
