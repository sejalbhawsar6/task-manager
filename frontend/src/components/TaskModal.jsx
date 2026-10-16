import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Modal from './Modal';
import { toDateKey } from '../utils/date';

const PRIORITIES = ['low', 'medium', 'high'];
const TITLE_MAX = 120;
const DESC_MAX = 1000;

export default function TaskModal({ task, onClose, onSave }) {
  const editing = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: toDateKey(task?.dueDate),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Please give your task a title.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave({ ...form, title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate || null });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit task' : 'New task'} onClose={saving ? () => {} : onClose}>
      <form className="form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Title *</span>
          <input
            autoFocus
            value={form.title}
            maxLength={TITLE_MAX}
            placeholder="What needs to be done?"
            onChange={(e) => set('title', e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-row">
            Description <small className="muted">{form.description.length}/{DESC_MAX}</small>
          </span>
          <textarea
            rows={4}
            value={form.description}
            maxLength={DESC_MAX}
            placeholder="Add more details (optional)"
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <div className="field">
          <span>Priority</span>
          <div className="segmented">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                className={`seg seg-${p}${form.priority === p ? ' active' : ''}`}
                onClick={() => set('priority', p)}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </label>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <LoaderCircle className="spin" size={18} />}
            {editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
