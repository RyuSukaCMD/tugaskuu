import { useEffect, useState } from 'react';
import { Bookmark, Heart, Link2, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { Post } from '../../lib/types';
import { cn, shareOrCopy } from '../../lib/utils';

export default function PostActions({ post, onChange, onToast }: { post: Post; onChange: (p: Partial<Post>) => void; onToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const { token, requireAuth } = useAuth();
  const [liked, setLiked] = useState(!!post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [bookmarked, setBookmarked] = useState(!!post.bookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmark_count || 0);

  // Keep local UI synchronized with a later page refresh, but never wait for it on click.
  useEffect(() => { setLiked(!!post.liked); setLikeCount(post.like_count || 0); }, [post.id, post.liked, post.like_count]);
  useEffect(() => { setBookmarked(!!post.bookmarked); setBookmarkCount(post.bookmark_count || 0); }, [post.id, post.bookmarked, post.bookmark_count]);

  const toggleLike = () => requireAuth(async () => {
    if (!token) return;
    const previous = { liked, count: likeCount };
    const next = !liked;
    setLiked(next); setLikeCount(Math.max(0, likeCount + (next ? 1 : -1)));
    onChange({ liked: next, like_count: Math.max(0, likeCount + (next ? 1 : -1)) });
    try { const res = await api.togglePostLike(token, post.id); setLiked(res.liked); setLikeCount(res.count); onChange({ liked: res.liked, like_count: res.count }); }
    catch (e) { setLiked(previous.liked); setLikeCount(previous.count); onChange({ liked: previous.liked, like_count: previous.count }); onToast(e instanceof Error ? e.message : 'Gagal memberi like', 'error'); }
  });

  const toggleBookmark = () => requireAuth(async () => {
    if (!token) return;
    const previous = { bookmarked, count: bookmarkCount };
    const next = !bookmarked;
    setBookmarked(next); setBookmarkCount(Math.max(0, bookmarkCount + (next ? 1 : -1)));
    onChange({ bookmarked: next, bookmark_count: Math.max(0, bookmarkCount + (next ? 1 : -1)) });
    try { const res = await api.toggleBookmark(token, post.id); setBookmarked(res.bookmarked); setBookmarkCount(res.count); onChange({ bookmarked: res.bookmarked, bookmark_count: res.count }); }
    catch (e) { setBookmarked(previous.bookmarked); setBookmarkCount(previous.count); onChange({ bookmarked: previous.bookmarked, bookmark_count: previous.count }); onToast(e instanceof Error ? e.message : 'Gagal menyimpan post', 'error'); }
  });

  const share = async () => { const result = await shareOrCopy(`${window.location.origin}/post/${post.slug}`, post.title); onToast(result === 'shared' ? 'Tautan dibagikan' : 'Tautan disalin', 'success'); };
  return <div className="flex flex-wrap items-center gap-2">
    <ActionBtn active={liked} onClick={toggleLike} icon={<Heart className={cn('h-4 w-4 transition-transform', liked && 'fill-current animate-like-pop')} />} label={String(likeCount)} activeClass="text-rose-600 bg-rose-50 dark:bg-rose-950/40" />
    <ActionBtn active={bookmarked} onClick={toggleBookmark} icon={<Bookmark className={cn('h-4 w-4 transition-transform', bookmarked && 'fill-current animate-like-pop')} />} label="Simpan" activeClass="text-violet-600 bg-violet-50 dark:bg-violet-950/40" />
    <ActionBtn onClick={share} icon={<Share2 className="h-4 w-4" />} label="Bagikan" />
    <ActionBtn onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`); onToast('Tautan disalin', 'success'); }} icon={<Link2 className="h-4 w-4" />} label="Salin" />
  </div>;
}
function ActionBtn({ icon, label, onClick, active, activeClass }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; activeClass?: string }) { return <button onClick={onClick} className={cn('touch-manipulation inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700', active && activeClass)}>{icon}{label}</button>; }
