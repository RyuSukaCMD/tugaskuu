import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all',
        'touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 active:scale-[0.97]',
        'disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-11 px-5 text-sm',
        variant === 'primary' &&
          'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-sm shadow-violet-500/20 hover:opacity-95 active:scale-[0.98]',
        variant === 'secondary' &&
          'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
        variant === 'ghost' &&
          'bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
        variant === 'outline' &&
          'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800/60',
        variant === 'danger' &&
          'bg-rose-600 text-white hover:bg-rose-500',
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </button>
  );
}
