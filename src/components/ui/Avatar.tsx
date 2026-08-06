import { cn } from '../../lib/utils';

export default function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };
  const initial = (name || '?').charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        className={cn(
          'rounded-full object-cover ring-2 ring-white dark:ring-zinc-900',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium',
        'bg-gradient-to-br from-violet-500 to-blue-600 text-white',
        'ring-2 ring-white dark:ring-zinc-900',
        sizes[size],
        className
      )}
    >
      {initial}
    </div>
  );
}
