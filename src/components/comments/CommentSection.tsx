import { useEffect, useState } from 'react';
import { Heart, MoreHorizontal, Reply, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { Comment } from '../../lib/types';
import { cn, timeAgo } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { Link } from 'react-router-dom';

export default function CommentSection({
  postId,
  onCountChange,
  onToast,
}: {
  postId: number;
  onCountChange?: (delta: number) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const { token, profile, requireAuth } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await api.getComments(postId, token);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, token]);

  const submit = () =>
    requireAuth(async () => {
      if (!token || !text.trim()) return;
      setSubmitting(true);
      try {
        await api.createComment(token, {
          post_id: postId,
          content: text.trim(),
          parent_id: replyTo?.id || null,
        });
        setText('');
        setReplyTo(null);
        onCountChange?.(1);
        await load();
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Gagal mengirim komentar', 'error');
      } finally {
        setSubmitting(false);
      }
    });

  return (
    <section className="space-y-5">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Komentar</h3>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800">
            <span>Membalas @{replyTo.author?.username}</span>
            <button onClick={() => setReplyTo(null)} className="text-violet-600">
              Batal
            </button>
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => requireAuth()}
          rows={3}
          placeholder="Tulis komentar... gunakan @username untuk mention"
          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" loading={submitting} onClick={submit} disabled={!text.trim()}>
            Kirim
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState title="Belum ada komentar" description="Jadilah yang pertama berkomentar." />
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              depth={0}
              currentUserId={profile?.id}
              isOwner={profile?.role === 'owner'}
              token={token}
              onReply={setReplyTo}
              onReload={load}
              onCountChange={onCountChange}
              onToast={onToast}
              requireAuth={requireAuth}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  depth,
  currentUserId,
  isOwner,
  token,
  onReply,
  onReload,
  onCountChange,
  onToast,
  requireAuth,
}: {
  comment: Comment;
  depth: number;
  currentUserId?: string;
  isOwner?: boolean;
  token: string | null;
  onReply: (c: Comment) => void;
  onReload: () => Promise<void>;
  onCountChange?: (d: number) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  requireAuth: (fn?: () => void) => boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const canManage = currentUserId === comment.user_id || isOwner;

  const like = () =>
    requireAuth(async () => {
      if (!token) return;
      try {
        await api.toggleCommentLike(token, comment.id);
        await onReload();
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Gagal', 'error');
      }
    });

  const saveEdit = async () => {
    if (!token || !editText.trim()) return;
    try {
      await api.updateComment(token, { id: comment.id, content: editText.trim() });
      setEditing(false);
      await onReload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Gagal', 'error');
    }
  };

  const remove = async () => {
    if (!token) return;
    if (!confirm('Hapus komentar ini?')) return;
    try {
      await api.deleteComment(token, comment.id);
      onCountChange?.(-1);
      await onReload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Gagal', 'error');
    }
  };

  return (
    <div className={cn(depth > 0 && 'ml-6 border-l border-zinc-200 pl-4 dark:border-zinc-800')}>
      <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link to={`/u/${comment.author?.username || ''}`} className="flex items-center gap-2">
            <Avatar src={comment.author?.avatar_url} name={comment.author?.nickname} size="sm" />
            <div>
              <p className="text-sm font-medium">{comment.author?.nickname}</p>
              <p className="text-xs text-zinc-400">{timeAgo(comment.created_at)}</p>
            </div>
          </Link>
          {canManage && (
            <div className="relative">
              <button onClick={() => setMenu((v) => !v)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menu && (
                <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {currentUserId === comment.user_id && (
                    <button
                      onClick={() => {
                        setEditing(true);
                        setMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenu(false);
                      remove();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}>Simpan</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Batal</Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{comment.content}</p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={like}
            className={cn(
              'inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-500',
              comment.liked && 'text-rose-500'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', comment.liked && 'fill-current')} />
            {comment.like_count || 0}
          </button>
          <button
            onClick={() => requireAuth(() => onReply(comment))}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-violet-600"
          >
            <Reply className="h-3.5 w-3.5" /> Balas
          </button>
        </div>
      </div>

      {comment.replies?.map((r) => (
        <div key={r.id} className="mt-3">
          <CommentItem
            comment={r}
            depth={depth + 1}
            currentUserId={currentUserId}
            isOwner={isOwner}
            token={token}
            onReply={onReply}
            onReload={onReload}
            onCountChange={onCountChange}
            onToast={onToast}
            requireAuth={requireAuth}
          />
        </div>
      ))}
    </div>
  );
}
