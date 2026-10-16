// Due dates are stored as calendar days ("YYYY-MM-DD" at UTC midnight),
// so we compare them as plain date strings to avoid time-zone shifts.

export const todayKey = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const toDateKey = (value) => (value ? String(value).slice(0, 10) : '');

export const formatDue = (value) => {
  const key = toDateKey(value);
  if (!key) return '';
  const date = new Date(`${key}T00:00:00`);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};

export const dueState = (task) => {
  const key = toDateKey(task.dueDate);
  if (!key || task.status === 'done') return 'normal';
  const today = todayKey();
  if (key < today) return 'overdue';
  if (key === today) return 'today';
  return 'normal';
};
