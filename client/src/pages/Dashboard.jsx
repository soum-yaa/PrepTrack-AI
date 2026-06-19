import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api.js';

const statusStyles = {
  Todo: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  'In Progress': 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
  Completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/dashboard/summary');
        if (!cancelled) setSummary(data.summary);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Failed to load dashboard data'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = summary
    ? [
        { label: 'Total Tasks', value: summary.totalTasks },
        { label: 'Completed Tasks', value: summary.completedTasks },
        { label: 'Pending Tasks', value: summary.pendingTasks },
        { label: 'Completion Rate', value: `${summary.completionRate}%` },
        { label: 'High Priority Tasks', value: summary.highPriorityTasks },
        { label: 'In Progress', value: summary.inProgressTasks },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Your task analytics at a glance.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Loading dashboard…
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Upcoming Deadlines</h2>
              {summary.upcomingDeadlines.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                  No upcoming deadlines.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {summary.upcomingDeadlines.map((task) => (
                    <li
                      key={task._id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          Due {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent Tasks</h2>
                <Link
                  to="/dashboard/tasks"
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  View all
                </Link>
              </div>
              {summary.recentTasks.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                  No tasks yet.{' '}
                  <Link
                    to="/dashboard/tasks"
                    className="font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {summary.recentTasks.map((task) => (
                    <li
                      key={task._id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {task.priority} priority · {formatDate(task.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </motion.div>
  );
}
