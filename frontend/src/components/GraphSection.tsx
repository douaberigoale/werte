import { useState } from 'react'
import WerteChart from './WerteChart'
import type { BloodTestGroup, BloodTestItem, BloodTestResult, Event, MedicationIntake } from '../types'
import { useLang } from '../i18n'

interface Props {
  items: BloodTestItem[]
  results: BloodTestResult[]
  intakes: MedicationIntake[]
  groups: BloodTestGroup[]
  events: Event[]
}

export default function GraphSection({ items, results, intakes, groups, events }: Props) {
  const { t } = useLang()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (name: string) =>
    setCollapsed(prev => ({ ...prev, [name]: !prev[name] }))

  if (groups.length === 0) {
    return (
      <div className="graph-section">
        <div className="chart-container">
          <WerteChart items={items} results={results} intakes={intakes} events={events} />
        </div>
      </div>
    )
  }

  return (
    <div className="graph-section">
      {groups.map(group => {
        const groupItems = items.filter(i => group.items.some(gi => gi.name === i.name))
        const groupResults = results.filter(r => groupItems.some(i => i.name === r.blood_test_item_name))
        const isCollapsed = !!collapsed[group.name]
        return (
          <div key={group.name} className="chart-container">
            <h3
              className={`chart-group-title collapsible${isCollapsed ? ' collapsed' : ''}`}
              onClick={() => toggle(group.name)}
            >
              <span>{group.name}</span>
              <span className="collapse-arrow">{isCollapsed ? '▸' : '▾'}</span>
            </h3>
            {!isCollapsed && (
              groupItems.length === 0 ? (
                <p className="chart-empty">{t.noItemsInGroup}</p>
              ) : groupResults.length === 0 ? (
                <p className="chart-empty">{t.noResultsInGroup}</p>
              ) : (
                <WerteChart items={groupItems} results={groupResults} intakes={intakes} events={events} />
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
