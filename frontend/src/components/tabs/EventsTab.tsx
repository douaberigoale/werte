import { useState } from 'react'
import type { Event } from '../../types'
import { createEvent, updateEvent, deleteEvent } from '../../api/client'
import { useLang } from '../../i18n'
import DataTable from '../DataTable'
import { todayStr, toInput, fromInput, cmpDate } from '../../utils/dates'
import { useSortable } from '../../utils/sortable'

interface Props {
  events: Event[]
  onDataChange: () => void
}

interface Draft { name: string; date: string }
const EMPTY: Draft = { name: '', date: todayStr() }

export default function EventsTab({ events, onDataChange }: Props) {
  const { t } = useLang()
  const [editingKey, setEditingKey] = useState<{ name: string; date: string } | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY)
  const [adding, setAdding] = useState(false)
  const [addDraft, setAddDraft] = useState<Draft>(EMPTY)

  const [filterFrom, setFilterFrom] = useState<string>('')
  const [filterTo, setFilterTo] = useState<string>('')

  const { sorted, sortHeader } = useSortable(events, 'date', 'desc')
  const filtered = sorted.filter(ev => {
    if (filterFrom && cmpDate(ev.date, filterFrom) < 0) return false
    if (filterTo && cmpDate(ev.date, filterTo) > 0) return false
    return true
  })
  const hasFilter = filterFrom || filterTo

  function startEdit(ev: Event) {
    setEditingKey({ name: ev.name, date: ev.date })
    setEditDraft({ name: ev.name, date: ev.date })
  }

  async function saveEdit() {
    if (editingKey == null || !editDraft.name.trim() || !editDraft.date) return
    await updateEvent(editingKey.name, editingKey.date, { name: editDraft.name.trim(), date: editDraft.date })
    setEditingKey(null)
    onDataChange()
  }

  async function doDelete(name: string, date: string) {
    if (!confirm(t.deleteEventConfirm)) return
    await deleteEvent(name, date)
    onDataChange()
  }

  async function doAdd() {
    if (!addDraft.name.trim() || !addDraft.date) return
    await createEvent({ name: addDraft.name.trim(), date: addDraft.date })
    setAddDraft(EMPTY)
    setAdding(false)
    onDataChange()
  }

  return (
    <div className="tab-panel">
      <div className="tab-panel-toolbar">
        <div className="filter-bar">
          <label className="filter-range-label">{t.from}</label>
          <input type="date" value={toInput(filterFrom)} onChange={e => setFilterFrom(fromInput(e.target.value))}
            style={{ width: 'auto' }} />
          <label className="filter-range-label">{t.to}</label>
          <input type="date" value={toInput(filterTo)} onChange={e => setFilterTo(fromInput(e.target.value))}
            style={{ width: 'auto' }} />
          {hasFilter && (
            <button className="btn-icon" onClick={() => { setFilterFrom(''); setFilterTo('') }}>✕</button>
          )}
        </div>
        {!adding && (
          <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setAddDraft(EMPTY) }}>
            {t.addEvent}
          </button>
        )}
      </div>

      <DataTable headers={[sortHeader(t.date, 'date'), sortHeader(t.name, 'name'), '']}>
        {adding && (
          <tr className="new-row">
            <td>
              <input type="date" value={toInput(addDraft.date)}
                onChange={e => setAddDraft(d => ({ ...d, date: fromInput(e.target.value) }))} autoFocus />
            </td>
            <td>
              <input type="text" value={addDraft.name}
                onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && doAdd()}
                placeholder={`${t.name} *`} />
            </td>
            <td className="row-actions">
              <button className="btn btn-primary btn-sm" onClick={doAdd}
                disabled={!addDraft.name.trim() || !addDraft.date}>{t.add}</button>
              <button className="btn-icon" onClick={() => setAdding(false)} title="Cancel">✕</button>
            </td>
          </tr>
        )}

        {filtered.map(ev =>
          editingKey?.name === ev.name && editingKey?.date === ev.date ? (
            <tr key={ev.name + '|' + ev.date} className="editing-row">
              <td>
                <input type="date" value={toInput(editDraft.date)}
                  onChange={e => setEditDraft(d => ({ ...d, date: fromInput(e.target.value) }))} autoFocus />
              </td>
              <td>
                <input type="text" value={editDraft.name}
                  onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()} />
              </td>
              <td className="row-actions">
                <button className="btn btn-primary btn-sm" onClick={saveEdit}
                  disabled={!editDraft.name.trim() || !editDraft.date}>{t.save}</button>
                <button className="btn-icon" onClick={() => setEditingKey(null)} title="Cancel">✕</button>
              </td>
            </tr>
          ) : (
            <tr key={ev.name + '|' + ev.date}>
              <td>{ev.date}</td>
              <td><strong>{ev.name}</strong></td>
              <td className="row-actions">
                <button className="btn-icon" onClick={() => startEdit(ev)} title="Edit">✎</button>
                <button className="btn-icon btn-icon-danger" onClick={() => doDelete(ev.name, ev.date)} title="Delete">✕</button>
              </td>
            </tr>
          )
        )}

        {filtered.length === 0 && !adding && (
          <tr>
            <td colSpan={3} className="empty-row">{t.noEventsYet}</td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
