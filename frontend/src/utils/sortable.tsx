import { useState } from 'react'
import type { ReactNode } from 'react'
import { cmpDate } from './dates'

type Dir = 'asc' | 'desc'

const DATE_COLS = new Set(['date', 'start_date', 'end_date'])

export function useSortable<T>(
  data: T[],
  defaultCol: string | null = null,
  defaultDir: Dir = 'asc',
  getValue?: (item: T, col: string) => unknown,
) {
  const [col, setCol] = useState<string | null>(defaultCol)
  const [dir, setDir] = useState<Dir>(defaultDir)

  function toggle(c: string) {
    if (col === c) setDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setCol(c); setDir('asc') }
  }

  function sortHeader(label: string, c: string): ReactNode {
    const active = col === c
    return (
      <span className={'sort-hdr' + (active ? ' sort-hdr--active' : '')} onClick={() => toggle(c)}>
        {label}
        <span className="sort-arrow">{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>
      </span>
    )
  }

  const sorted = col == null ? data : [...data].sort((a, b) => {
    const av = getValue ? getValue(a, col) : (a as unknown as Record<string, unknown>)[col]
    const bv = getValue ? getValue(b, col) : (b as unknown as Record<string, unknown>)[col]
    let cmp: number
    if (DATE_COLS.has(col) && typeof av === 'string' && typeof bv === 'string') {
      cmp = cmpDate(av, bv)
    } else if (av == null && bv == null) {
      cmp = 0
    } else if (av == null) {
      cmp = 1
    } else if (bv == null) {
      cmp = -1
    } else if (typeof av === 'string' && typeof bv === 'string') {
      cmp = av.localeCompare(bv)
    } else if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else {
      cmp = 0
    }
    return dir === 'asc' ? cmp : -cmp
  })

  return { sorted, sortHeader }
}
