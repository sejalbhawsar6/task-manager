import { ClipboardList, Plus, SearchX } from 'lucide-react';

export default function EmptyState({ filtered, onCreate, onClear }) {
  if (filtered) {
    return (
      <div className="empty">
        <span className="empty-icon"><SearchX size={28} /></span>
        <h3>No matching tasks</h3>
        <p className="muted">Try a different search or clear the filters.</p>
        <button type="button" className="btn btn-ghost" onClick={onClear}>Clear filters</button>
      </div>
    );
  }
  return (
    <div className="empty">
      <span className="empty-icon"><ClipboardList size={28} /></span>
      <h3>No tasks yet</h3>
      <p className="muted">Create your first task and start getting things done.</p>
      <button type="button" className="btn btn-primary" onClick={onCreate}>
        <Plus size={18} /> Create your first task
      </button>
    </div>
  );
}
