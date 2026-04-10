import { useState, useRef, useEffect } from 'react'
import {
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts'
import type { BloodTestItem, BloodTestResult, Event, MedicationIntake } from '../types'
import { useLang } from '../i18n'
import { todayStr, cmpDate, addDays } from '../utils/dates'

const BLOOD_COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#264653', '#6a4c93', '#1982c4', '#8ac926', '#ff595e',
]
const MED_COLORS = [
  '#6d6875', '#b5838d', '#e5989b', '#ffcdb2', '#a7c957',
  '#386641', '#6a994e', '#bc4749', '#a98467', '#c9ada7',
]

function colorForName(name: string, palette: string[]): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

interface ChartDataPoint {
  date: string
  [key: string]: number | string | null
}

interface Props {
  items: BloodTestItem[]
  results: BloodTestResult[]
  intakes: MedicationIntake[]
  events?: Event[]
}

function buildChartData(
  results: BloodTestResult[],
  intakes: MedicationIntake[],
  events: Event[],
): ChartDataPoint[] {
  const dateSet = new Set<string>()
  results.forEach(r => dateSet.add(r.date))
  events.forEach(e => dateSet.add(e.date))

  const lastResultDate = results.reduce<string | null>(
    (max, r) => max === null || cmpDate(r.date, max) > 0 ? r.date : max, null,
  )
  const ongoingCutoff = lastResultDate ?? todayStr()

  intakes.forEach(intake => {
    dateSet.add(intake.start_date)
    if (intake.end_date) {
      dateSet.add(intake.end_date)
      dateSet.add(addDays(intake.end_date, 1))
    }
  })

  const dates = Array.from(dateSet).sort(cmpDate)
  if (dates.length === 0) return []

  const map: Record<string, ChartDataPoint> = {}
  dates.forEach(d => { map[d] = { date: d } })

  results.forEach(r => {
    const key = `bti_${r.blood_test_item_name}`
    if (map[r.date]) map[r.date][key] = r.value
  })

  intakes.forEach(intake => {
    if (!intake.end_date) return
    const key = `med_${intake.medication_name}`
    const dayAfter = addDays(intake.end_date, 1)
    if (map[dayAfter]) map[dayAfter][key] = 0
  })

  intakes.forEach(intake => {
    const key = `med_${intake.medication_name}`
    const endDate = intake.end_date ?? ongoingCutoff
    dates.forEach(d => {
      if (cmpDate(d, intake.start_date) >= 0 && cmpDate(d, endDate) <= 0) {
        const existing = (map[d][key] as number | null) ?? null
        map[d][key] = existing !== null ? existing + intake.daily_dose : intake.daily_dose
      }
    })
  })

  return dates.map(d => map[d])
}

function EventLineLabel({ viewBox, name }: { viewBox?: { x?: number; y?: number }; name: string }) {
  const x = viewBox?.x ?? 0
  const y = (viewBox?.y ?? 0) + 4
  // Estimate bubble dimensions (no DOM access in SVG render)
  const fontSize = 9
  const padX = 5, padY = 3
  const bw = Math.max(name.length * fontSize * 0.6 + padX * 2, 20)
  const bh = fontSize + padY * 2
  return (
    <g>
      <rect x={x - bw / 2} y={y} width={bw} height={bh} rx={3}
        fill="rgba(251,191,36,0.92)" stroke="rgba(161,98,7,0.35)" strokeWidth={0.5} />
      <text x={x} y={y + bh / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={fontSize} fontWeight="600" fill="#78350f">
        {name}
      </text>
    </g>
  )
}

export default function WerteChart({ items, results, intakes, events = [] }: Props) {
  const { t } = useLang()
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [hovered, setHovered]   = useState<string | null>(null)

  // brushKey increments on scroll/reset → forces Brush remount with new initial indices.
  // We also remount on mouseup to release any sticky drag.
  const [brushKey, setBrushKey] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const zoomAreaRef  = useRef<HTMLDivElement>(null)
  // brushInitRef: indices passed as startIndex/endIndex when the Brush mounts
  const brushInitRef = useRef({ start: 0, end: 0 })
  // zoomStateRef: live state readable by wheel handler and mouseup handler without re-renders
  const zoomStateRef = useRef({ start: 0, end: 0, max: 0 })

  const chartData = buildChartData(results, intakes, events)
  const maxIdx    = chartData.length - 1

  // Sync refs when data length changes (initial load, new entries)
  if (zoomStateRef.current.max !== maxIdx && !isZoomed) {
    brushInitRef.current  = { start: 0, end: maxIdx }
    zoomStateRef.current  = { start: 0, end: maxIdx, max: maxIdx }
  }
  zoomStateRef.current.max = maxIdx

  const startIdx = brushInitRef.current.start
  const endIdx   = brushInitRef.current.end

  // Scroll to zoom: remount Brush with new indices each time
  useEffect(() => {
    const el = zoomAreaRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { start, end, max } = zoomStateRef.current
      const range   = end - start
      const center  = (start + end) / 2
      const factor  = e.deltaY > 0 ? 1.3 : 0.75
      const newHalf = Math.max(1, Math.round((range * factor) / 2))
      const newStart = Math.max(0, Math.min(Math.round(center - newHalf), max))
      const newEnd   = Math.max(0, Math.min(Math.round(center + newHalf), max))
      brushInitRef.current = { start: newStart, end: newEnd }
      zoomStateRef.current = { start: newStart, end: newEnd, max }
      setIsZoomed(newStart !== 0 || newEnd !== max)
      setBrushKey(k => k + 1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Global mouseup: finalise drag position so handles never stay stuck
  useEffect(() => {
    const onMouseUp = () => {
      const { start, end } = zoomStateRef.current
      if (start !== brushInitRef.current.start || end !== brushInitRef.current.end) {
        brushInitRef.current = { start, end }
        setIsZoomed(start !== 0 || end !== zoomStateRef.current.max)
        setBrushKey(k => k + 1)
      }
    }
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [])

  const toggleVisibility = (key: string) =>
    setVisible(prev => ({ ...prev, [key]: !(prev[key] !== false) }))
  const isVisible = (key: string) => visible[key] !== false

  const activeItemNames = Array.from(new Set(results.map(r => r.blood_test_item_name)))
  const activeItems     = items.filter(i => activeItemNames.includes(i.name))

  const itemNorms = new Map<string, { min: number; max: number; unit: string }>()
  activeItems.forEach(item => {
    const key    = `bti_${item.name}`
    const values = chartData.map(d => d[key] as number | null).filter((v): v is number => v != null)
    if (values.length === 0) return
    itemNorms.set(key, { min: Math.min(...values), max: Math.max(...values), unit: item.unit })
  })

  const normalizedData: ChartDataPoint[] = chartData.map(point => {
    const out: ChartDataPoint = { ...point }
    itemNorms.forEach(({ min, max }, key) => {
      const val = point[key] as number | null
      if (val == null) return
      out[key] = max > min ? (val - min) / (max - min) : 0.5
    })
    return out
  })


  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean; label?: string
    payload?: Array<{ dataKey: string; name: string; value: number; color: string }>
  }) => {
    if (!active || !payload?.length) return null
    const entries = payload.filter(e => e.value != null)
    if (!entries.length) return null
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
        <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#475569' }}>{label}</p>
        {entries.map(entry => {
          const norm   = itemNorms.get(entry.dataKey)
          const actual = norm ? (norm.max > norm.min ? entry.value * (norm.max - norm.min) + norm.min : norm.min) : entry.value
          const display = norm ? `${+actual.toFixed(3)} ${norm.unit}` : String(entry.value)
          return (
            <p key={entry.dataKey} style={{ margin: '2px 0', color: entry.color }}>
              {entry.name}: {display}
            </p>
          )
        })}
      </div>
    )
  }

  const intakeSeries = Array.from(
    intakes.reduce((map, intake) => {
      if (!map.has(intake.medication_name)) {
        const label = intake.medication?.name ?? intake.medication_name
        map.set(intake.medication_name, { key: `med_${intake.medication_name}`, label, color: colorForName(label, MED_COLORS) })
      }
      return map
    }, new Map<string, { key: string; label: string; color: string }>()).values()
  )

  type LegendEntry = { dataKey: string; value: string; color: string }

  const renderLegend = (props: { payload?: LegendEntry[] }) => (
    <ul style={{ display: 'flex', flexWrap: 'wrap', listStyle: 'none', padding: 0, margin: '8px 0 0', fontSize: 12, gap: '4px 16px' }}>
      {(props.payload ?? []).map(entry => (
        <li key={entry.dataKey}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            opacity: isVisible(entry.dataKey) ? 1 : 0.35,
            fontWeight: hovered === entry.dataKey ? 700 : 400,
            textDecoration: hovered === entry.dataKey ? 'underline' : 'none' }}
          onClick={() => toggleVisibility(entry.dataKey)}
          onMouseEnter={() => setHovered(entry.dataKey)}
          onMouseLeave={() => setHovered(null)}
        >
          <span style={{ display: 'inline-block', width: 14, height: hovered === entry.dataKey ? 4 : 3, background: entry.color, flexShrink: 0 }} />
          {entry.value}
        </li>
      ))}
    </ul>
  )

  if (chartData.length === 0) {
    return <div className="chart-empty"><p>{t.noDataYet}</p></div>
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-toolbar">
        {isZoomed && (
          <button className="btn btn-secondary btn-sm" onClick={() => {
            brushInitRef.current = { start: 0, end: maxIdx }
            zoomStateRef.current = { start: 0, end: maxIdx, max: maxIdx }
            setIsZoomed(false)
            setBrushKey(k => k + 1)
          }}>
            {t.resetZoom}
          </button>
        )}
        <span className="chart-hint">{t.scrollToZoom}</span>
      </div>

      <div ref={zoomAreaRef} className="chart-zoom-area">
        <ResponsiveContainer width="100%" height={520}>
          <ComposedChart data={normalizedData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            onMouseLeave={() => setHovered(null)}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis yAxisId="left"  domain={[0, 1]} tick={false} width={8} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={35} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend as never} />

            <Brush
              key={brushKey}
              dataKey="date"
              startIndex={startIdx}
              endIndex={endIdx}
              height={24}
              stroke="#94a3b8"
              fill="#f1f5f9"
              travellerWidth={8}
              onChange={({ startIndex, endIndex }) => {
                if (startIndex != null && endIndex != null) {
                  zoomStateRef.current.start = startIndex
                  zoomStateRef.current.end   = endIndex
                }
              }}
            />

            {(() => {
              const intakeDates = new Set(
                intakes.flatMap(i => {
                  const dates = [i.start_date]
                  if (i.end_date) dates.push(i.end_date, addDays(i.end_date, 1))
                  return dates
                })
              )
              return Array.from(new Set(results.map(r => r.date)))
                .filter(d => !intakeDates.has(d))
                .map(date => (
                  <ReferenceLine key={`rd_${date}`} x={date} yAxisId="left"
                    stroke="rgba(148,163,184,0.25)" strokeWidth={1}
                  />
                ))
            })()}

            {events.map(ev => (
              <ReferenceLine key={`ev_${ev.name}|${ev.date}`} x={ev.date} yAxisId="left"
                stroke="rgba(251,191,36,0.5)" strokeWidth={1.5} strokeDasharray="4 3"
                label={<EventLineLabel name={ev.name} />}
              />
            ))}

            {activeItems.map(item => {
              const key = `bti_${item.name}`
              return (
                <Line key={key} yAxisId="left" type="monotone" dataKey={key}
                  name={`${item.name} (${item.unit})`}
                  stroke={colorForName(item.name, BLOOD_COLORS)}
                  strokeWidth={hovered === key ? 3 : 1.5}
                  dot={false} connectNulls hide={!isVisible(key)}
                  onMouseEnter={() => setHovered(key)}
                />
              )
            })}

            {intakeSeries.map(series => (
              <Line key={series.key} yAxisId="right" type="stepAfter" dataKey={series.key}
                name={series.label} stroke={series.color}
                strokeWidth={hovered === series.key ? 4 : 2}
                strokeDasharray="4 4" dot={false} connectNulls hide={!isVisible(series.key)}
                onMouseEnter={() => setHovered(series.key)}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
