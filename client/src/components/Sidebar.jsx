import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn.js';

const primary = { to: '/dashboard', label: 'Overview', icon: '📊', end: true };

const secondary = [
  { to: '/dashboard/tasks', label: 'Tasks', icon: '✅' },
  { to: '/dashboard/applications', label: 'Applications', icon: '💼' },
];

export function Sidebar({ open, onClose }) {
  const aside = (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Workspace
      </p>
      <nav className="flex flex-col gap-1">
        <NavLink
          to={primary.to}
          end={primary.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text)]'
            )
          }
          onClick={onClose}
        >
          <span aria-hidden>{primary.icon}</span>
          {primary.label}
        </NavLink>
        {secondary.map((item) =>
          item.to ? (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text)]'
                )
              }
              onClick={onClose}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ) : (
            <button
              key={item.label}
              type="button"
              disabled
              title="Coming soon"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--color-text-muted)] opacity-60"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </button>
          )
        )}
      </nav>
      <div className="mt-auto rounded-lg border border-dashed border-[var(--color-border)] p-3 text-xs text-[var(--color-text-muted)]">
        AI summaries and nudges can live in this panel.
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block">{aside}</div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black md:hidden"
              aria-label="Close menu"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              {aside}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
