import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, LoaderCircle, Plus, RefreshCw } from 'lucide-react';
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

const PAGE_SIZE = 10;
const LEAVE_MS = 300;
const DEFAULT_FILTERS = { status: 'all', priority: 'all', search: '', sort: 'newest' };
const EMPTY_STATS = { total: 0, todo: 0, 'in-progress': 0, done: 0, overdue: 0 };

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const withId = (set, id) => new Set(set).add(id);
const withoutId = (set, id) => {
  const next = new Set(set);
  next.delete(id);
  return next;
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [leavingIds, setLeavingIds] = useState(() => new Set());
  const [celebrateIds, setCelebrateIds] = useState(() => new Set());
  const [modal, setModal] = useState(null); // { task } or { task: null } for create
  const [toDelete, setToDelete] = useState(null);

  const search = useDebounce(filters.search);
  const requestId = useRef(0);
  const slow = useSlowHint(loading);

  const isFiltered =
    filters.status !== 'all' || filters.priority !== 'all' || filters.search.trim() !== '';

  const buildParams = useCallback(
    (offset) => {
      const params = { sort: filters.sort, offset, limit: PAGE_SIZE };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.priority !== 'all') params.priority = filters.priority;
      if (search.trim()) params.search = search.trim();
      return params;
    },
    [filters.status, filters.priority, filters.sort, search]
  );

  // Loads the first page. Any older request still in flight is ignored.
  const loadTasks = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/tasks', { params: buildParams(0) });
      if (id !== requestId.current) return;
      setTasks(data.tasks);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      if (id === requestId.current) setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [buildParams]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const { data } = await api.get('/tasks', { params: buildParams(tasks.length) });
      if (id !== requestId.current) return; // filters changed meanwhile
      setTasks((list) => {
        const seen = new Set(list.map((t) => t._id));
        return [...list, ...data.tasks.filter((t) => !seen.has(t._id))];
      });
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

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

  const matchesFilters = (task) =>
    (filters.status === 'all' || task.status === filters.status) &&
    (filters.priority === 'all' || task.priority === filters.priority);

  const setBusy = (id, on) => setBusyIds((prev) => (on ? withId(prev, id) : withoutId(prev, id)));

  const celebrate = (id) => {
    setCelebrateIds((prev) => withId(prev, id));
    setTimeout(() => setCelebrateIds((prev) => withoutId(prev, id)), 900);
  };

  // Plays the exit animation, then removes the card from the list.
  const animateOut = (id) =>
    new Promise((resolve) => {
      setLeavingIds((prev) => withId(prev, id));
      setTimeout(() => {
        setTasks((list) => list.filter((t) => t._id !== id));
        setLeavingIds((prev) => withoutId(prev, id));
        setTotal((t) => Math.max(t - 1, 0));
        resolve();
      }, LEAVE_MS);
    });

  const saveTask = async (payload) => {
    const editing = modal.task;
    try {
      if (editing) {
        const { data } = await api.put(`/tasks/${editing._id}`, payload);
        toast.success('Task updated');
        setModal(null);
        if (data.task.status === 'done' && editing.status !== 'done') celebrate(data.task._id);
        if (matchesFilters(data.task)) {
          setTasks((list) => list.map((t) => (t._id === data.task._id ? data.task : t)));
        } else {
          animateOut(data.task._id);
        }
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
        setModal(null);
        loadTasks();
      }
      loadStats();
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
    if (status === 'done') celebrate(task._id);
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status });
      if (status === 'done') toast.success('Nice! Task completed');
      if (matchesFilters(data.task)) {
        setTasks((list) => list.map((t) => (t._id === task._id ? data.task : t)));
      } else {
        animateOut(task._id);
      }
      loadStats();
    } catch (err) {
      setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, status: previous } : t)));
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(task._id, false);
    }
  };

  const confirmDelete = async () => {
    const target = toDelete;
    try {
      await api.delete(`/tasks/${target._id}`);
      toast.success('Task deleted');
      setToDelete(null);
      await animateOut(target._id);
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const openCount = stats.total - stats.done;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="container dashboard">
        <div className="page-head">
          <div>
            <h1>{greeting()}, {firstName} <span className="wave">👋</span></h1>
            <p className="muted">
              {stats.total === 0
                ? 'Let’s plan something today.'
                : `You have ${openCount} open task${openCount === 1 ? '' : 's'}${stats.overdue ? `, ${stats.overdue} overdue` : ''}.`}
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-shine" onClick={() => setModal({ task: null })}>
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
            tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index % PAGE_SIZE}
                busy={busyIds.has(task._id)}
                leaving={leavingIds.has(task._id)}
                celebrating={celebrateIds.has(task._id)}
                onToggleDone={(t) => changeStatus(t, t.status === 'done' ? 'todo' : 'done')}
                onStatusChange={changeStatus}
                onEdit={(t) => setModal({ task: t })}
                onDelete={setToDelete}
              />
            ))
          )}
        </section>

        {!error && tasks.length > 0 && (
          <div className="list-footer">
            <span className="muted">
              Showing {tasks.length} of {total} task{total === 1 ? '' : 's'}
            </span>
            {hasMore ? (
              <button type="button" className="btn btn-ghost btn-load-more" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <LoaderCircle className="spin" size={16} /> : <ChevronDown size={16} />}
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            ) : (
              total > PAGE_SIZE && <span className="muted end-note">You’ve reached the end 🎉</span>
            )}
          </div>
        )}
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
