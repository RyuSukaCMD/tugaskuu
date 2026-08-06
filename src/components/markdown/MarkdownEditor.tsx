import { useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import MarkdownRenderer from './MarkdownRenderer';

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = '180px',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="flex min-w-0 items-center justify-between border-b border-zinc-200 px-2 dark:border-zinc-800">
        <div className="flex">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px',
              tab === 'write'
                ? 'border-violet-600 text-violet-700 dark:text-violet-300'
                : 'border-transparent text-zinc-500'
            )}
          >
            <Pencil className="h-3.5 w-3.5" /> Tulis
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px',
              tab === 'preview'
                ? 'border-violet-600 text-violet-700 dark:text-violet-300'
                : 'border-transparent text-zinc-500'
            )}
          >
            <Eye className="h-3.5 w-3.5" /> Pratinjau
          </button>
        </div>
        <span className="hidden shrink-0 pr-2 text-[11px] text-zinc-400 sm:inline">Markdown · LaTeX $...$</span>
      </div>
      {tab === 'write' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Tulis penjelasan... Gunakan **tebal**, daftar, dan $E=mc^2$'}
          className="w-full resize-y bg-transparent px-4 py-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          style={{ minHeight }}
        />
      ) : (
        <div className="px-4 py-3" style={{ minHeight }}>
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-zinc-400">Belum ada konten untuk dipratinjau.</p>
          )}
        </div>
      )}
    </div>
  );
}
