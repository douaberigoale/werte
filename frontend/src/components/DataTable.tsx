import type { ReactNode } from 'react'

interface Props {
  headers: ReactNode[]
  children: ReactNode
}

export default function DataTable({ headers, children }: Props) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
