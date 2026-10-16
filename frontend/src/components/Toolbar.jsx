import { Search, X } from 'lucide-react';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function Toolbar({ filters, onChange }) {
  const set = (key) => (e) => onChange({ [key]: e.target.value });

  return (
    <div className="toolbar">
      <div className="search">
        <Search size={18} className="search-icon" />
        <input
          type="search"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={set('search')}
          aria-label="Search tasks"
        />
        {filters.search && (
          <button type="button" className="search-clear" onClick={() => onChange({ search: '' })} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="tabs" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={filters.status === t.value}
            className={`tab${filters.status === t.value ? ' active' : ''}`}
            onClick={() => onChange({ status: t.value })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="selects">
        <select value={filters.priority} onChange={set('priority')} aria-label="Filter by priority">
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.sort} onChange={set('sort')} aria-label="Sort tasks">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>
  );
}
