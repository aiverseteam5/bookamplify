type PillVariant = 'pending' | 'approved' | 'rejected' | 'draft' | 'active'

interface StatusPillProps {
  status: PillVariant
  label?: string
}

const LABELS: Record<PillVariant, string> = {
  pending:  'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  draft:    'Draft',
  active:   'Active',
}

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span className={`ba-pill ba-pill--${status}`}>
      {label ?? LABELS[status]}
    </span>
  )
}
