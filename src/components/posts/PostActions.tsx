import { useState } from 'react';
import {
  Bookmark,
  Heart,
  Link2,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { Post } from '../../lib/types';
import { cn, shareOrCopy } from '../../lib/utils';

export default function PostActions({
  post,
  onChange,
  onToast,
}: {
  post: Post;
  onChange: (p: Partial<Post>) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const { token, requireAuth } = useAuth();
  const [busy, setBusy] = useState(false);

  const toggleLike = () =>
    requireAuth(async () => {
      if (!token || busy) return;
      setBusy(true);
      try {
        const res = await api.togglePostLike(token, post.id);
        onChange({ liked: res.liked, like_count: res.count });
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Gagal', 'error');
      } finally {
        setBusy(false);
      }
    });

  const toggleBookmark = () =>
    requireAuth(async () => {
      if (!token || busy) return;
      setBusy(true);
      try {
        const res = await api.toggleBookmark(token, post.id);
        onChange({ bookmarked: res.bookmarked, bookmark_count: res.count });
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Gagal', 'error');
      } finally {
        setBusy(false);
      }
    });

  const share = async () => {
    const url = `${window.location.origin}/post/${post.slug}`;
    const result = await shareOrCopy(url, post.title);
    onToast(result === 'shared' ? 'Tautan dibagikan' : 'Tautan disalin', 'success');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionBtn
        active={!!post.liked}
        onClick={toggleLike}
        icon={<Heart className={cn('h-4 w-4', post.liked && 'fill-current')} />}
        label={String(post.like_count || 0)}
        activeClass="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
      />
      <ActionBtn
        active={!!post.bookmarked}
        onClick={toggleBookmark}
        icon={<Bookmark className={cn('h-4 w-4', post.bookmarked && 'fill-current')} />}
        label="Simpan"
        activeClass="text-violet-600 bg-violet-50 dark:bg-violet-950/40"
      />
      <ActionBtn onClick={share} icon={<Share2 className="h-4 w-4" />} label="Bagikan" />
      <ActionBtn
        onClick={async () => {
          await navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
          onToast('Tautan disalin', 'success');
        }}
        icon={<Link2 className="h-4 w-4" />}
        label="Salin"
      />
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  active,
  activeClass,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition',
        'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
        active && activeClass
      )}
    >
      {icon}
      {label}
    </button>
  );
}
