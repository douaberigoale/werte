import { Fragment, useState } from 'react'
import type { BloodTestItem, BloodTestResult } from '../../types'
import { createBloodTestResults, updateBloodTestResult, deleteBloodTestResult } from '../../api/client'
import { useLang } from '../../i18n'
import DataTable from '../DataTable'
import { toInput, fromInput, cmpDate, todayStr } from '../../utils/dates'
import { useSortable } from '../../utils/sortable'

interface Props {
  results: BloodTestResult[]
  items: BloodTestItem[]
  onDataChange: () => void
}

interface EditDraft {
  blood_test_item_name: string
  date: string
  value: string
}

interface BatchRow {
  blood_test_item_name: string
  value: string
}

type GroupBy = 'none' | 'item' | 'date'

export default function ResultsTab({ results, items, onDataChange }: Props) {
  const { t } = useLang()
  const [editingKey, setEditingKey] = useState<{ name: string; date: string } | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft>({ blood_test_item_name: '', date: todayStr(), value: '' })
  const [adding, setAdding] = useState(false)
  const [batchDate, setBatchDate] = useState(todayStr())
  const [batchRows, setBatchRows] = useState<BatchRow[]>([{ blood_test_item_name: '', value: '' }])
  const [filterItem, setFilterItem] = useState<string>('')
  const [filterFrom, setFilterFrom] = useState<string>('')
  const [filterTo, setFilterTo] = useState<string>('')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  const getValue = (r: BloodTestResult, col: string) => {
    if (col === 'name') return r.blood_test_item_name
    return (r as unknown as Record<string, unknown>)[col]
  }
  const { sorted, sortHeader } = useSortable(results, 'date', 'desc', getValue)

  const filtered = sorted.filter(r => {
    if (filterItem && r.blood_test_item_name !== filterItem) return false
    if (filterFrom && cmpDate(r.date, filterFrom) < 0) return false
    if (filterTo && cmpDate(r.date, filterTo) > 0) return false
    return true
  })
  const hasFilter = filterItem || filterFrom || filterTo

  // Grouping
  const groups: { key: string; rows: BloodTestResult[] }[] = (() => {
    if (groupBy === 'none') return [{ key: '', rows: filtered }]
    const map = new Map<string, BloodTestResult[]>()
    filtered.forEach(r => {
      const key = groupBy === 'item' ? r.blood_test_item_name : r.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    const arr = Array.from(map.entries()).map(([key, rows]) => ({ key, rows }))
    if (groupBy === 'item') arr.sort((a, b) => a.key.localeCompare(b.key))
    else arr.sort((a, b) => cmpDate(b.key, a.key))
    return arr
  })()

  function startEdit(r: BloodTestResult) {
    setEditingKey({ name: r.blood_test_item_name, date: r.date })
    setEditDraft({ blood_test_item_name: r.blood_test_item_name, date: r.date, value: String(r.value) })
  }

  async function saveEdit() {
    if (editingKey == null || editDraft.blood_test_item_name === '') return
    const v = parseFloat(editDraft.value)
    if (isNaN(v)) return
    await updateBloodTestResult(editingKey.name, editingKey.date, {
      blood_test_item_name: editDraft.blood_test_item_name,
      date: editDraft.date,
      value: v,
    })
    setEditingKey(null)
    onDataChange()
  }

  async function doDelete(blood_test_item_name: string, date: string) {
    if (!confirm(t.deleteResultConfirm)) return
    await deleteBloodTestResult(blood_test_item_name, date)
    onDataChange()
  }

  function startAdd() {
    setAdding(true)
    setBatchDate(todayStr())
    setBatchRows([{ blood_test_item_name: '', value: '' }])
  }

  function addBatchRow() {
    setBatchRows(rows => [...rows, { blood_test_item_name: '', value: '' }])
  }

  function removeBatchRow(i: number) {
    setBatchRows(rows => rows.filter((_, j) => j !== i))
  }

  function updateBatchRow(i: number, patch: Partial<BatchRow>) {
    setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, ...patch } : r))
  }

  async function doAdd() {
    const valid = batchRows.filter(r => r.blood_test_item_name !== '' && r.value !== '')
    if (valid.length === 0 || !batchDate) return
    const parsed = valid.map(r => ({ blood_test_item_name: r.blood_test_item_name, date: batchDate, value: parseFloat(r.value) }))
    if (parsed.some(r => isNaN(r.value))) return
    await createBloodTestResults(parsed)
    setAdding(false)
    onDataChange()
  }

  const itemUnit = (name: string) => items.find(i => i.name === name)?.unit ?? ''

  const canSave = batchRows.some(r => r.blood_test_item_name !== '' && r.value !== '') && !!batchDate

  return (
    <div className="tab-panel">
      <div className="tab-panel-toolbar">
        <div className="filter-bar">
          <select value={filterItem} onChange={e => setFilterItem(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}>
            <option value="">{t.allItems}</option>
            {items.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
          </select>
          <label className="filter-range-label">{t.from}</label>
          <input type="date" value={toInput(filterFrom)} onChange={e => setFilterFrom(fromInput(e.target.value))}
            style={{ width: 'auto' }} />
          <label className="filter-range-label">{t.to}</label>
          <input type="date" value={toInput(filterTo)} onChange={e => setFilterTo(fromInput(e.target.value))}
            style={{ width: 'auto' }} />
          {hasFilter && (
            <button className="btn-icon" onClick={() => { setFilterItem(''); setFilterFrom(''); setFilterTo('') }}>✕</button>
          )}
          <label className="filter-range-label">Group:</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupBy)} style={{ width: 'auto' }}>
            <option value="none">None</option>
            <option value="item">{t.item}</option>
            <option value="date">{t.date}</option>
          </select>
        </div>
        {adding ? (
          <div className="batch-controls">
            <button className="btn btn-primary btn-sm" onClick={doAdd} disabled={!canSave}>{t.saveAll}</button>
            <button className="btn-icon" onClick={() => setAdding(false)} title="Cancel">✕</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={startAdd} disabled={items.length === 0}>
            {t.addResult}
          </button>
        )}
      </div>

      {items.length === 0 && (
        <p className="info-hint">{t.addItemsFirst}</p>
      )}

      <DataTable headers={[sortHeader(t.date, 'date'), sortHeader(t.item, 'name'), sortHeader(t.value, 'value'), '']}>
        {adding && (
          <>
            {batchRows.map((row, i) => (
              <tr key={i} className="new-row">
                <td>
                  {i === 0 ? (
                    <input type="date" value={toInput(batchDate)}
                      onChange={e => setBatchDate(fromInput(e.target.value))} autoFocus />
                  ) : (
                    <span className="batch-shared-date">{batchDate}</span>
                  )}
                </td>
                <td>
                  <select value={row.blood_test_item_name}
                    onChange={e => updateBatchRow(i, { blood_test_item_name: e.target.value })}>
                    <option value="">{t.selectItem}</option>
                    {items.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                </td>
                <td>
                  <div className="value-with-unit">
                    <input type="number" value={row.value}
                      onChange={e => updateBatchRow(i, { value: e.target.value })}
                      placeholder="0.0" />
                    <span className="unit-label">
                      {row.blood_test_item_name !== '' ? itemUnit(row.blood_test_item_name) : ''}
                    </span>
                  </div>
                </td>
                <td className="row-actions">
                  {i === batchRows.length - 1 && (
                    <button className="btn-icon" onClick={addBatchRow} title={t.addAnother}>+</button>
                  )}
                  {batchRows.length > 1 && (
                    <button className="btn-icon btn-icon-danger" onClick={() => removeBatchRow(i)} title="Remove">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </>
        )}

        {groups.map(group => (
          <Fragment key={group.key || '__all'}>
            {groupBy !== 'none' && (
              <tr className="group-header-row">
                <td colSpan={4}>{group.key}</td>
              </tr>
            )}
            {group.rows.map(r =>
              editingKey?.name === r.blood_test_item_name && editingKey?.date === r.date ? (
                <tr key={r.blood_test_item_name + '|' + r.date} className="editing-row">
                  <td>
                    <input type="date" value={toInput(editDraft.date)}
                      onChange={e => setEditDraft(d => ({ ...d, date: fromInput(e.target.value) }))} />
                  </td>
                  <td>
                    <select value={editDraft.blood_test_item_name}
                      onChange={e => setEditDraft(d => ({ ...d, blood_test_item_name: e.target.value }))}>
                      {items.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="value-with-unit">
                      <input type="number" value={editDraft.value}
                        onChange={e => setEditDraft(d => ({ ...d, value: e.target.value }))} />
                      <span className="unit-label">
                        {editDraft.blood_test_item_name !== '' ? itemUnit(editDraft.blood_test_item_name) : ''}
                      </span>
                    </div>
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>{t.save}</button>
                    <button className="btn-icon" onClick={() => setEditingKey(null)} title="Cancel">✕</button>
                  </td>
                </tr>
              ) : (
                <tr key={r.blood_test_item_name + '|' + r.date}>
                  <td>{r.date}</td>
                  <td>{r.blood_test_item_name}</td>
                  <td>
                    <span className="value-display">
                      {r.value} <span className="unit-label">{itemUnit(r.blood_test_item_name)}</span>
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="btn-icon" onClick={() => startEdit(r)} title="Edit">✎</button>
                    <button className="btn-icon btn-icon-danger" onClick={() => doDelete(r.blood_test_item_name, r.date)} title="Delete">✕</button>
                  </td>
                </tr>
              )
            )}
          </Fragment>
        ))}

        {filtered.length === 0 && !adding && (
          <tr>
            <td colSpan={4} className="empty-row">
              {results.length === 0 ? t.noResultsYet : t.noResultsMatch}
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
