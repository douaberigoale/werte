import { useState } from 'react'
import type { Medication } from '../../types'
import { createMedication, updateMedication, deleteMedication } from '../../api/client'
import { useLang } from '../../i18n'
import DataTable from '../DataTable'
import { useSortable } from '../../utils/sortable'

interface Props {
  medications: Medication[]
  onDataChange: () => void
}

interface Draft { name: string; description: string }
const EMPTY: Draft = { name: '', description: '' }

export default function MedicationsTab({ medications, onDataChange }: Props) {
  const { t } = useLang()
  const { sorted, sortHeader } = useSortable(medications, 'name', 'asc')
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY)
  const [adding, setAdding] = useState(false)
  const [addDraft, setAddDraft] = useState<Draft>(EMPTY)

  function startEdit(med: Medication) {
    setEditingName(med.name)
    setEditDraft({ name: med.name, description: med.description ?? '' })
  }

  async function saveEdit() {
    if (editingName == null || !editDraft.name.trim()) return
    await updateMedication(editingName, {
      name: editDraft.name.trim(),
      description: editDraft.description.trim() || null,
    })
    setEditingName(null)
    onDataChange()
  }

  async function doDelete(name: string) {
    if (!confirm(t.deleteMedConfirm)) return
    await deleteMedication(name)
    onDataChange()
  }

  async function doAdd() {
    if (!addDraft.name.trim()) return
    await createMedication({
      name: addDraft.name.trim(),
      description: addDraft.description.trim() || null,
    })
    setAddDraft(EMPTY)
    setAdding(false)
    onDataChange()
  }

  return (
    <div className="tab-panel">
      <div className="tab-panel-toolbar">
        {!adding && (
          <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setAddDraft(EMPTY) }}>
            {t.addMedication}
          </button>
        )}
      </div>

      <DataTable headers={[sortHeader(t.name, 'name'), sortHeader(t.description, 'description'), '']}>
        {adding && (
          <tr className="new-row">
            <td>
              <input type="text" value={addDraft.name}
                onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && doAdd()}
                placeholder={t.medicationNamePlaceholder} autoFocus />
            </td>
            <td>
              <input type="text" value={addDraft.description}
                onChange={e => setAddDraft(d => ({ ...d, description: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && doAdd()}
                placeholder={t.optional} />
            </td>
            <td className="row-actions">
              <button className="btn btn-primary btn-sm" onClick={doAdd}
                disabled={!addDraft.name.trim()}>{t.add}</button>
              <button className="btn-icon" onClick={() => setAdding(false)} title="Cancel">✕</button>
            </td>
          </tr>
        )}

        {sorted.map(med =>
          editingName === med.name ? (
            <tr key={med.name} className="editing-row">
              <td>
                <input type="text" value={editDraft.name}
                  onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  autoFocus />
              </td>
              <td>
                <input type="text" value={editDraft.description}
                  onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  placeholder={t.optional} />
              </td>
              <td className="row-actions">
                <button className="btn btn-primary btn-sm" onClick={saveEdit}
                  disabled={!editDraft.name.trim()}>{t.save}</button>
                <button className="btn-icon" onClick={() => setEditingName(null)} title="Cancel">✕</button>
              </td>
            </tr>
          ) : (
            <tr key={med.name}>
              <td><strong>{med.name}</strong></td>
              <td className="text-muted">{med.description ?? '—'}</td>
              <td className="row-actions">
                <button className="btn-icon" onClick={() => startEdit(med)} title="Edit">✎</button>
                <button className="btn-icon btn-icon-danger" onClick={() => doDelete(med.name)} title="Delete">✕</button>
              </td>
            </tr>
          )
        )}

        {medications.length === 0 && !adding && (
          <tr>
            <td colSpan={3} className="empty-row">{t.noMedicationsYet}</td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
