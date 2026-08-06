import { AnimatePresence, motion } from 'framer-motion';
import type { ToastItem } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

export default function ToastStack({
  toasts,
}: {
  toasts: ToastItem[];
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              'min-w-[220px] rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur',
              'bg-white/95 border-zinc-200 text-zinc-800',
              'dark:bg-zinc-900/95 dark:border-zinc-700 dark:text-zinc-100',
              t.type === 'error' && 'border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300',
              t.type === 'success' && 'border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300'
            )}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
