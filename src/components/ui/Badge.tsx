import { cn } from '../../lib/utils';

export default function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'violet' | 'blue' | 'soft';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
        tone === 'violet' && 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
        tone === 'blue' && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        tone === 'soft' && 'bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800',
        className
      )}
    >
      {children}
    </span>
  );
}
