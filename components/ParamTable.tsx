type Row = { name: string; type: string; required?: boolean; desc: string }

export function ParamTable({ rows }: { rows: Row[] }) {
  return (
    <div className="params">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td data-label="Name">
                <code>{r.name}</code>
                {r.required ? <span className="req">required</span> : null}
              </td>
              <td data-label="Type">
                <code>{r.type}</code>
              </td>
              <td data-label="Description">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
