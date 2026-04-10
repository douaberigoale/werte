import { useState } from 'react'
import type { BloodTestGroup, BloodTestItem, BloodTestResult, Event, Medication, MedicationIntake } from '../types'
import { useLang } from '../i18n'
import ItemsTab from './tabs/ItemsTab'
import ResultsTab from './tabs/ResultsTab'
import MedicationsTab from './tabs/MedicationsTab'
import IntakesTab from './tabs/IntakesTab'
import GroupsTab from './tabs/GroupsTab'
import EventsTab from './tabs/EventsTab'

type TabKey = 'types' | 'results' | 'medications' | 'intakes' | 'groups' | 'events'

interface Props {
  items: BloodTestItem[]
  results: BloodTestResult[]
  medications: Medication[]
  intakes: MedicationIntake[]
  groups: BloodTestGroup[]
  events: Event[]
  onDataChange: () => void
}

const COUNTS: Record<TabKey, (p: Props) => number> = {
  types: p => p.items.length,
  results: p => p.results.length,
  medications: p => p.medications.length,
  intakes: p => p.intakes.length,
  groups: p => p.groups.length,
  events: p => p.events.length,
}

const TAB_KEYS: TabKey[] = ['types', 'results', 'medications', 'intakes', 'groups', 'events']

export default function DataEditor(props: Props) {
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState<TabKey>('types')
  const { items, results, medications, intakes, groups, events, onDataChange } = props

  const tabLabel: Record<TabKey, string> = {
    types: t.tabTypes,
    results: t.tabResults,
    medications: t.tabMedications,
    intakes: t.tabIntakes,
    groups: t.tabGroups,
    events: t.tabEvents,
  }

  return (
    <div className="data-editor">
      <div className="tab-bar">
        {TAB_KEYS.map(key => (
          <button
            key={key}
            className={`tab-btn${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {tabLabel[key]}
            <span className="tab-count">{COUNTS[key](props)}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'types' && (
          <ItemsTab items={items} onDataChange={onDataChange} />
        )}
        {activeTab === 'results' && (
          <ResultsTab results={results} items={items} onDataChange={onDataChange} />
        )}
        {activeTab === 'medications' && (
          <MedicationsTab medications={medications} onDataChange={onDataChange} />
        )}
        {activeTab === 'intakes' && (
          <IntakesTab intakes={intakes} medications={medications} onDataChange={onDataChange} />
        )}
        {activeTab === 'groups' && (
          <GroupsTab groups={groups} items={items} onDataChange={onDataChange} />
        )}
        {activeTab === 'events' && (
          <EventsTab events={events} onDataChange={onDataChange} />
        )}
      </div>
    </div>
  )
}
