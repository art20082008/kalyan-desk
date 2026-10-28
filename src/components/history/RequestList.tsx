import { useState } from 'react'
import type { OrderRequest } from '../../types'
import { formatHistoryDate, plural } from '../../domain/format'
import { HistoryRow } from '../ui/HistoryRow'
import { RequestDetail } from './RequestDetail'

export function RequestList({ requests }: { requests: OrderRequest[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (requests.length === 0) {
    return (
      <div className="empty">
        <h3>Нет заявок</h3>
        <p>Когда выгрузите заявку с полки, она появится здесь.</p>
      </div>
    )
  }

  return (
    <div className="history-list">
      {requests.map((request) => {
        const open = openId === request.id
        return (
          <HistoryRow
            key={request.id}
            date={formatHistoryDate(request.createdAt)}
            count={`${request.flavors.length} ${plural(request.flavors.length, 'вкус', 'вкуса', 'вкусов')}`}
            open={open}
            onToggle={() => setOpenId(open ? null : request.id)}
          >
            <RequestDetail request={request} />
          </HistoryRow>
        )
      })}
    </div>
  )
}
