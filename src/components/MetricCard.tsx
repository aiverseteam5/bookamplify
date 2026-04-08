interface MetricCardProps {
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  icon?: React.ReactNode
}

export function MetricCard({ label, value, delta, trend = 'flat', icon }: MetricCardProps) {
  return (
    <div className="ba-metric-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="ba-metric-card__label">{label}</span>
        {icon && <span style={{ color: 'var(--ba-text-muted)', opacity: 0.7 }}>{icon}</span>}
      </div>
      <div className="ba-metric-card__value">{value}</div>
      {delta && (
        <div className={`ba-metric-card__delta ba-metric-card__delta--${trend}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {delta}
        </div>
      )}
    </div>
  )
}
