import type { ProjectTradeoffV2 } from "@/features/knowledge-base/lib/schemas"

type TradeoffsListProps = {
  items: ProjectTradeoffV2[]
}

function formatCell(value: string | undefined) {
  const text = value?.trim()
  return text || "—"
}

export function TradeoffsList({ items }: TradeoffsListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="case-study-tradeoffs-table-wrap">
      <table className="case-study-tradeoffs-table">
        <thead>
          <tr>
            <th scope="col">Decision</th>
            <th scope="col">Alternative</th>
            <th scope="col">Reason</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.decision}-${index}`}>
              <td className="case-study-tradeoffs-cell case-study-tradeoffs-cell--decision">
                {item.decision}
              </td>
              <td className="case-study-tradeoffs-cell">
                {formatCell(item.alternative)}
              </td>
              <td className="case-study-tradeoffs-cell">
                {formatCell(item.reason || item.tradeoff)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
