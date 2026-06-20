import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api.js';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Todo', 'In Progress', 'Completed'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
];

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
const PRIORITY_COLORS = { Low: '#34d399', Medium: '#fbbf24', High: '#f87171' };

const priorityStyles = {
  Low: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  High: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

const statusStyles = {
  Todo: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  'In Progress': 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
  Completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Todo',
  dueDate: '',
};

function formatDueDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toInputDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function sortTasks(list, sortBy) {
  const sorted = [...list];
  if (sortBy === 'dueDate') {
    return sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }
  if (sortBy === 'priority') {
    return sorted.sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    );
  }
  return sorted.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const inputClass =
    'mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none ring-[var(--color-primary)] focus:ring-2';
  const labelClass = 'text-xs font-medium text-[var(--color-text-muted)]';

  const loadTasks = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/api/tasks');
      setTasks(data.tasks);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load tasks'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const displayedTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (query && !task.title.toLowerCase().includes(query)) return false;
      if (statusFilter && task.status !== statusFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      return true;
    });
    return sortTasks(filtered, sortBy);
  }, [tasks, search, statusFilter, priorityFilter, sortBy]);

  const hasActiveFilters =
    search.trim() || statusFilter || priorityFilter || sortBy !== 'newest';

  function resetCreateForm() {
    setForm(EMPTY_FORM);
    setShowCreateForm(false);
  }

  function openEditModal(task) {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: toInputDate(task.dueDate),
    });
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
    };

    try {
      const { data } = await api.post('/api/tasks', payload);
      setTasks((prev) => [data.task, ...prev]);
      resetCreateForm();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to create task'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
    };

    try {
      const { data } = await api.put(`/api/tasks/${editingId}`, payload);
      setTasks((prev) =>
        prev.map((t) => (t._id === editingId ? data.task : t))
      );
      closeEditModal();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to update task'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    setUpdatingStatusId(taskId);
    setError('');
    try {
      const { data } = await api.put(`/api/tasks/${taskId}`, {
        status: newStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? data.task : t))
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to update status'
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    setError('');
    try {
      await api.delete(`/api/tasks/${deleteTarget._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      if (editingId === deleteTarget._id) closeEditModal();
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to delete task'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function TaskFormFields({ idPrefix = 'task' }) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`${idPrefix}-title`}>
            Title
          </label>
          <input
            id={`${idPrefix}-title`}
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`${idPrefix}-description`}>
            Description
          </label>
          <textarea
            id={`${idPrefix}-description`}
            className={`${inputClass} min-h-24 resize-y`}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Optional details about this task…"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-priority`}>
            Priority
          </label>
          <select
            id={`${idPrefix}-priority`}
            className={inputClass}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-status`}>
            Status
          </label>
          <select
            id={`${idPrefix}-status`}
            className={inputClass}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`${idPrefix}-due`}>
            Due date
          </label>
          <input
            id={`${idPrefix}-due`}
            type="date"
            className={inputClass}
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Create, filter, and manage your work items.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showCreateForm) {
              resetCreateForm();
            } else {
              setForm(EMPTY_FORM);
              setShowCreateForm(true);
            }
          }}
          className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] sm:w-auto"
        >
          {showCreateForm ? 'Cancel' : '+ New task'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showCreateForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm sm:p-5"
          >
            <p className="text-sm font-semibold">Create a new task</p>
            <div className="mt-4">
              <TaskFormFields idPrefix="create" />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Create task'}
              </button>
              <button
                type="button"
                onClick={resetCreateForm}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none ring-[var(--color-primary)] focus:ring-2 sm:col-span-2 lg:col-span-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none ring-[var(--color-primary)] focus:ring-2"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none ring-[var(--color-primary)] focus:ring-2"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none ring-[var(--color-primary)] focus:ring-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && !loading && tasks.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Showing {displayedTasks.length} of {tasks.length} tasks
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-10 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Loading your tasks…
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-10 text-center">
          <p className="text-3xl" aria-hidden>
            📋
          </p>
          <p className="mt-3 text-base font-semibold">No tasks yet</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Create your first task to start tracking your work.
          </p>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowCreateForm(true);
            }}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            Create your first task
          </button>
        </div>
      ) : displayedTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-10 text-center">
          <p className="text-3xl" aria-hidden>
            🔍
          </p>
          <p className="mt-3 text-base font-semibold">No matching tasks</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Try changing your search or filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
              setSortBy('newest');
            }}
            className="mt-4 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-border)]/30"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayedTasks.map((task) => (
            <article
              key={task._id}
              className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-sm"
            >
              <div className="flex">
                <div
                  className="w-1 shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                />
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <select
                      value={task.status}
                      disabled={updatingStatusId === task._id}
                      onChange={(e) =>
                        handleStatusChange(task._id, e.target.value)
                      }
                      className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold outline-none ring-[var(--color-primary)] focus:ring-2 disabled:opacity-60 ${statusStyles[task.status]}`}
                      aria-label={`Update status for ${task.title}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <h2 className="mt-3 line-clamp-2 font-semibold">{task.title}</h2>

                  {task.description && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--color-text-muted)]">
                      {task.description}
                    </p>
                  )}

                  {task.dueDate && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                      <span aria-hidden>📅</span>
                      Due {formatDueDate(task.dueDate)}
                    </p>
                  )}

                  <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-border)] pt-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openEditModal(task)}
                      className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-border)]/30"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(task)}
                      className="flex-1 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editModalOpen && (
          <Modal title="Edit task" onClose={closeEditModal}>
            <form onSubmit={handleEdit}>
              <TaskFormFields idPrefix="edit" />
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <Modal title="Delete task?" onClose={() => setDeleteTarget(null)}>
            <p className="text-sm text-[var(--color-text-muted)]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[var(--color-text)]">
                {deleteTarget.title}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {submitting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
