import { CircleCheck, Clock, ListTodo, TriangleAlert, LayoutGrid } from 'lucide-react';

const CARDS = [
  { key: 'total', label: 'All tasks', icon: LayoutGrid, filter: 'all', tone: 'indigo' },
  { key: 'todo', label: 'To do', icon: ListTodo, filter: 'todo', tone: 'slate' },
  { key: 'in-progress', label: 'In progress', icon: Clock, filter: 'in-progress', tone: 'amber' },
  { key: 'done', label: 'Completed', icon: CircleCheck, filter: 'done', tone: 'green' },
  { key: 'overdue', label: 'Overdue', icon: TriangleAlert, filter: null, tone: 'red' },
];

export default function StatsCards({ stats, activeStatus, onSelect }) {
  const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <section className="stats">
      <div className="stats-grid">
        {CARDS.map(({ key, label, icon: Icon, filter, tone }) => {
          const clickable = filter !== null;
          const active = clickable && activeStatus === filter;
          return (
            <button
              key={key}
              type="button"
              className={`stat-card tone-${tone}${active ? ' active' : ''}`}
              onClick={clickable ? () => onSelect(filter) : undefined}
              disabled={!clickable}
            >
              <span className="stat-icon"><Icon size={18} /></span>
              <span className="stat-value">{stats[key] ?? 0}</span>
              <span className="stat-label">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="progress-card">
        <div className="progress-head">
          <span>Overall progress</span>
          <strong>{percent}%</strong>
        </div>
        <div className="progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </section>
  );
}
