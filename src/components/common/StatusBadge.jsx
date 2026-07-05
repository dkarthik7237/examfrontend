const statusConfig = {
  Pending:   { label: 'In Progress',   classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  Submitted: { label: 'Submitted',     classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  Debarred:  { label: 'Debarred',      classes: 'bg-red-100 text-red-700 border border-red-200' },
  Graded:    { label: 'Graded',        classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  upcoming:  { label: 'Upcoming',      classes: 'bg-surface-100 text-surface-600 border border-surface-200' },
  active:    { label: 'Active',        classes: 'bg-green-100 text-green-700 border border-green-200' },
  expired:   { label: 'Expired',       classes: 'bg-red-100 text-red-600 border border-red-200' },
  published: { label: 'Published',     classes: 'bg-green-100 text-green-700 border border-green-200' },
  draft:     { label: 'Draft',         classes: 'bg-surface-100 text-surface-600 border border-surface-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] ?? { label: status, classes: 'bg-surface-100 text-surface-600 border border-surface-200' };
  return (
    <span className={`badge ${cfg.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block flex-shrink-0" />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
