import { useState } from 'react'
import type { OrderRequest } from '../../types'
import { formatDateTime, plural } from '../../domain/format'
import { RequestDetail } from './RequestDetail'

export function RequestList({ requests }: { requests: OrderRequest[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (requests.length === 0) {
    return (
      <div className="empty">
        <h3>Нет заявок</h3>
        <p>Когда выгрузите или скопируете заявку с полки, она появится здесь.</p>
      </div>
    )
  }

  return (
    <ul className="request-list">
      {requests.map((request) => {
        const open = openId === request.id
        return (
          <li key={request.id}>
            <button type="button" className="request-row" onClick={() => setOpenId(open ? null : request.id)} aria-expanded={open}>
              <span>{formatDateTime(request.createdAt)}</span>
              <strong>
                {request.flavors.length} {plural(request.flavors.length, 'вкус', 'вкуса', 'вкусов')}
              </strong>
            </button>
            {open ? <RequestDetail request={request} /> : null}
          </li>
        )
      })}
    </ul>
  )
}
