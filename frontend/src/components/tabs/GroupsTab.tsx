import { useState } from 'react'
import type { BloodTestGroup, BloodTestItem } from '../../types'
import {
  createBloodTestGroup,
  updateBloodTestGroup,
  deleteBloodTestGroup,
  syncBloodTestGroupItems,
} from '../../api/client'
import { useLang } from '../../i18n'

interface Props {
  groups: BloodTestGroup[]
  items: BloodTestItem[]
  onDataChange: () => void
}

export default function GroupsTab({ groups, items, onDataChange }: Props) {
  const { t } = useLang()
  const [newGroupName, setNewGroupName] = useState('')
  const [editingNames, setEditingNames] = useState<Record<string, string>>({})

  async function doCreate() {
    if (!newGroupName.trim()) return
    await createBloodTestGroup({ name: newGroupName.trim() })
    setNewGroupName('')
    onDataChange()
  }

  async function doRename(group: BloodTestGroup) {
    const name = editingNames[group.name] ?? group.name
    if (!name.trim() || name === group.name) {
      setEditingNames(prev => { const n = { ...prev }; delete n[group.name]; return n })
      return
    }
    await updateBloodTestGroup(group.name, { name: name.trim() })
    setEditingNames(prev => { const n = { ...prev }; delete n[group.name]; return n })
    onDataChange()
  }

  async function doDelete(group: BloodTestGroup) {
    if (!confirm(t.deleteGroupConfirm(group.name))) return
    await deleteBloodTestGroup(group.name)
    onDataChange()
  }

  async function toggleItem(group: BloodTestGroup, itemName: string) {
    const current = group.items.map(i => i.name)
    const next = current.includes(itemName)
      ? current.filter(n => n !== itemName)
      : [...current, itemName]
    await syncBloodTestGroupItems(group.name, next)
    onDataChange()
  }

  return (
    <div className="tab-panel">
      <div className="add-group-row">
        <input
          type="text"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doCreate()}
          placeholder={t.newGroupNamePlaceholder}
          style={{ maxWidth: 280 }}
        />
        <button className="btn btn-primary btn-sm" onClick={doCreate} disabled={!newGroupName.trim()}>
          {t.createGroup}
        </button>
      </div>

      {groups.length === 0 && (
        <p className="empty-row" style={{ textAlign: 'center' }}>
          {t.noGroupsYet}
        </p>
      )}

      {groups.map(group => (
        <div key={group.name} className="group-card">
          <div className="group-card-header">
            <input
              className="group-name-input"
              type="text"
              value={editingNames[group.name] ?? group.name}
              onChange={e => setEditingNames(prev => ({ ...prev, [group.name]: e.target.value }))}
              onBlur={() => doRename(group)}
              onKeyDown={e => e.key === 'Enter' && doRename(group)}
            />
            <span className="text-muted" style={{ fontSize: 12 }}>
              {t.groupItemCount(group.items.length)}
            </span>
            <button className="btn-icon btn-icon-danger" onClick={() => doDelete(group)} title="Delete group">✕</button>
          </div>

          {items.length === 0 ? (
            <p style={{ padding: '0.75rem 1rem', color: 'var(--c-muted)', fontSize: 13 }}>
              {t.noBloodTestItems}
            </p>
          ) : (
            <div className="group-item-grid">
              {items.map(item => (
                <label key={item.name} className="group-item-checkbox">
                  <input
                    type="checkbox"
                    checked={group.items.some(gi => gi.name === item.name)}
                    onChange={() => toggleItem(group, item.name)}
                  />
                  {item.name}
                  <span className="unit-badge" style={{ marginLeft: 4 }}>{item.unit}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
