import { Calendar, Check, Flag, Pencil, Trash2 } from 'lucide-react';
import { dueState, formatDue } from '../utils/date';

const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };
const DUE_LABEL = { overdue: 'Overdue', today: 'Due today' };

export default function TaskCard({ task, index = 0, busy, leaving, celebrating, onToggleDone, onStatusChange, onEdit, onDelete }) {
  const done = task.status === 'done';
  const due = dueState(task);

  return (
    <article
      className={`task-card priority-${task.priority}${done ? ' is-done' : ''}${busy ? ' is-busy' : ''}${
        leaving ? ' is-leaving' : ''
      }${celebrating ? ' just-done' : ''}`}
      style={{ '--i': index }}
    >
      <button
        type="button"
        className={`check${done ? ' checked' : ''}`}
        onClick={() => onToggleDone(task)}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        disabled={busy}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="task-body">
        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-desc">{task.description}</p>}

        <div className="task-meta">
          <span className={`badge badge-${task.priority}`}>
            <Flag size={12} /> {PRIORITY_LABEL[task.priority]}
          </span>
          {task.dueDate && (
            <span className={`badge badge-due due-${due}`}>
              <Calendar size={12} /> {formatDue(task.dueDate)}
              {DUE_LABEL[due] ? ` · ${DUE_LABEL[due]}` : ''}
            </span>
          )}
          <select
            className={`status-select status-${task.status}`}
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
            disabled={busy}
            aria-label="Change status"
          >
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div className="task-actions">
        <button type="button" className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task" title="Edit">
          <Pencil size={16} />
        </button>
        <button type="button" className="icon-btn danger" onClick={() => onDelete(task)} aria-label="Delete task" title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
