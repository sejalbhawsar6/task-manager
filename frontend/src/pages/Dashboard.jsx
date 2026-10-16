import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import StatsCards from '../components/StatsCards';
import Toolbar from '../components/Toolbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import TaskSkeleton from '../components/TaskSkeleton';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import useSlowHint from '../hooks/useSlowHint';
import { todayKey } from '../utils/date';

const DEFAULT_FILTERS = { status: 'all', priority: 'all', search: '', sort: 'newest' };
const EMPTY_STATS = { total: 0, todo: 0, 'in-progress': 0, done: 0, overdue: 0 };

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [modal, setModal] = useState(null); // { task } or { task: null } for create
  const [toDelete, setToDelete] = useState(null);

  const search = useDebounce(filters.search);
  const requestId = useRef(0);
  const slow = useSlowHint(loading);

  const isFiltered =
    filters.status !== 'all' || filters.priority !== 'all' || filters.search.trim() !== '';

  const loadTasks = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const params = { sort: filters.sort };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.priority !== 'all') params.priority = filters.priority;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/tasks', { params });
      if (id === requestId.current) setTasks(data.tasks);
    } catch (err) {
      if (id === requestId.current) setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [filters.status, filters.priority, filters.sort, search]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks/stats', { params: { today: todayKey() } });
      setStats(data.stats);
    } catch {
      // Stats are secondary; the task list shows its own error.
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = () => Promise.all([loadTasks(), loadStats()]);
  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const setBusy = (id, on) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const saveTask = async (payload) => {
    try {
      if (modal.task) {
        await api.put(`/tasks/${modal.task._id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
      }
      setModal(null);
      refresh();
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const changeStatus = async (task, status) => {
    if (task.status === status) return;
    const previous = task.status;
    setBusy(task._id, true);
    // Optimistic update so the UI feels instant.
    setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await api.put(`/tasks/${task._id}`, { status });
      if (status === 'done') toast.success('Nice! Task completed');
      refresh();
    } catch (err) {
      setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, status: previous } : t)));
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(task._id, false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/tasks/${toDelete._id}`);
      toast.success('Task deleted');
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="app-shell">
      <Navbar />

      <main className="container dashboard">
        <div className="page-head">
          <div>
            <h1>{greeting()}, {firstName} 👋</h1>
            <p className="muted">
              {stats.total === 0
                ? 'Let’s plan something today.'
                : `You have ${stats.total - stats.done} open task${stats.total - stats.done === 1 ? '' : 's'}${stats.overdue ? `, ${stats.overdue} overdue` : ''}.`}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setModal({ task: null })}>
            <Plus size={18} /> New task
          </button>
        </div>

        <StatsCards stats={stats} activeStatus={filters.status} onSelect={(status) => updateFilters({ status })} />

        <Toolbar filters={filters} onChange={updateFilters} />

        <section className="task-list" aria-busy={loading}>
          {error ? (
            <div className="empty">
              <h3>Couldn’t load tasks</h3>
              <p className="muted">{error}</p>
              <button type="button" className="btn btn-ghost" onClick={refresh}>
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          ) : loading && tasks.length === 0 ? (
            <>
              <TaskSkeleton />
              {slow && <p className="hint center">Waking up the server (free hosting), this can take up to a minute…</p>}
            </>
          ) : tasks.length === 0 ? (
            <EmptyState
              filtered={isFiltered}
              onCreate={() => setModal({ task: null })}
              onClear={() => setFilters(DEFAULT_FILTERS)}
            />
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                busy={busyIds.has(task._id)}
                onToggleDone={(t) => changeStatus(t, t.status === 'done' ? 'todo' : 'done')}
                onStatusChange={changeStatus}
                onEdit={(t) => setModal({ task: t })}
                onDelete={setToDelete}
              />
            ))
          )}
        </section>
      </main>

      {modal && <TaskModal task={modal.task} onClose={() => setModal(null)} onSave={saveTask} />}

      {toDelete && (
        <ConfirmDialog
          title="Delete task?"
          message={`“${toDelete.title}” will be permanently deleted.`}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
