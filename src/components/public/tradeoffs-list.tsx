import type { ProjectTradeoffV2 } from "@/lib/knowledge/schemas"

type TradeoffsListProps = {
  items: ProjectTradeoffV2[]
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
              <td className="case-study-tradeoffs-decision">{item.decision}</td>
              <td>{item.alternative || "—"}</td>
              <td>{item.reason || item.tradeoff || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
