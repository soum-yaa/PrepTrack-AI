import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api.js';

const STATUS_COLORS = {
  Todo: '#94a3b8',
  'In Progress': '#818cf8',
  Completed: '#34d399',
};

const PRIORITY_COLORS = {
  Low: '#34d399',
  Medium: '#fbbf24',
  High: '#f87171',
};

const statusStyles = {
  Todo: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  'In Progress': 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
  Completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

const priorityStyles = {
  Low: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  High: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

const chartTooltipStyle = {
  backgroundColor: 'var(--color-surface-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-text)',
  fontSize: '12px',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysUntil(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `${diff} days left`;
}

function StatCard({ icon, label, value, children }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {children}
        </div>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-lg"
          aria-hidden
        >
          {icon}
        </span>
      </div>
    </div>
  );
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

  const statusChartData =
    summary?.statusCounts?.filter((item) => item.value > 0) ?? [];
  const priorityChartData =
    summary?.priorityCounts?.filter((item) => item.value > 0) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {summary?.userName
            ? `${getGreeting()}, ${summary.userName}!`
            : 'Dashboard'}
        </h1>
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
            <StatCard icon="📋" label="Total Tasks" value={summary.totalTasks} />
            <StatCard
              icon="✅"
              label="Completed Tasks"
              value={summary.completedTasks}
            />
            <StatCard
              icon="⏳"
              label="Pending Tasks"
              value={summary.pendingTasks}
            />
            <StatCard
              icon="📈"
              label="Completion Rate"
              value={`${summary.completionRate}%`}
            >
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                    style={{ width: `${summary.completionRate}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {summary.completedTasks} of {summary.totalTasks} tasks done
                </p>
              </div>
            </StatCard>
            <StatCard
              icon="🔥"
              label="High Priority"
              value={summary.highPriorityTasks}
            />
            <StatCard
              icon="🚀"
              label="In Progress"
              value={summary.inProgressTasks}
            />
            <StatCard
  icon="💼"
  label="Applications"
  value={summary.totalApplications}
/>

<StatCard
  icon="🎯"
  label="Interviews"
  value={summary.interviews}
/>

<StatCard
  icon="🏆"
  label="Offers"
  value={summary.offers}
/>

<StatCard
  icon="❌"
  label="Rejections"
  value={summary.rejections}
/>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Task Status</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                How your tasks are distributed by status
              </p>
              {statusChartData.length === 0 ? (
                <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
                  No tasks to chart yet.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {statusChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Priority Distribution</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Tasks grouped by priority level
              </p>
              {priorityChartData.length === 0 ? (
                <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
                  No tasks to chart yet.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityChartData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {priorityChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PRIORITY_COLORS[entry.name]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  📅
                </span>
                <h2 className="text-sm font-semibold">Upcoming Deadlines</h2>
              </div>
              {summary.upcomingDeadlines.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                  No upcoming deadlines. You&apos;re all caught up!
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {summary.upcomingDeadlines.map((task) => {
                    const due = new Date(task.dueDate);
                    const day = due.getDate();
                    const month = due.toLocaleDateString(undefined, {
                      month: 'short',
                    });

                    return (
                      <li
                        key={task._id}
                        className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                      >
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                          <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
                            {month}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {day}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {daysUntil(task.dueDate)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[task.priority]}`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[task.status]}`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    🕐
                  </span>
                  <h2 className="text-sm font-semibold">Recent Tasks</h2>
                </div>
                <Link
                  to="/dashboard/tasks"
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  View all
                </Link>
              </div>
              {summary.recentTasks.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                  No tasks yet.{' '}
                  <Link
                    to="/dashboard/tasks"
                    className="font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {summary.recentTasks.map((task) => (
                    <li
                      key={task._id}
                      className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <div className="flex">
                        <div
                          className="w-1 shrink-0"
                          style={{
                            backgroundColor: PRIORITY_COLORS[task.priority],
                          }}
                        />
                        <div className="flex flex-1 items-start justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-muted)]">
                                {task.description}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                              Created {formatDate(task.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[task.status]}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
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
