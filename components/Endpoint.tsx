export function Endpoint({ method, path }: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string }) {
  return (
    <div className="endpoint">
      <span className={`method method-${method.toLowerCase()}`}>{method}</span>
      <code>{path}</code>
    </div>
  )
}
