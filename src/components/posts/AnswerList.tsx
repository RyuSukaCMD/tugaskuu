import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { QuestionAnswer } from '../../lib/types';
import { cn, timeAgo } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import MarkdownEditor from '../markdown/MarkdownEditor';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import ImageUploader from './ImageUploader';
import { Skeleton } from '../ui/Skeleton';

export default function AnswerList({
  postId,
  onCountChange,
  onToast,
}: {
  postId: number;
  onCountChange?: (delta: number) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const { token, profile, requireAuth } = useAuth();
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await api.getAnswers(postId, token);
      setAnswers(data);
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
      if (!token || content.trim().length < 5) {
        onToast('Jawaban minimal 5 karakter', 'error');
        return;
      }
      setSubmitting(true);
      try {
        await api.createAnswer(token, { post_id: postId, content, images });
        setContent('');
        setImages([]);
        onCountChange?.(1);
        await load();
        onToast('Jawaban terkirim', 'success');
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Gagal', 'error');
      } finally {
        setSubmitting(false);
      }
    });

  const vote = (answerId: number, value: 1 | -1) =>
    requireAuth(async () => {
      if (!token) return;
      try {
        const res = await api.voteAnswer(token, answerId, value);
        setAnswers((prev) =>
          prev.map((a) =>
            a.id === answerId
              ? {
                  ...a,
                  user_vote: res.user_vote,
                  upvote_count: res.upvote_count,
                  downvote_count: res.downvote_count,
                }
              : a
          )
        );
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Gagal vote', 'error');
      }
    });

  const remove = async (id: number) => {
    if (!token) return;
    if (!confirm('Hapus jawaban ini?')) return;
    try {
      await api.deleteAnswer(token, id);
      onCountChange?.(-1);
      await load();
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Gagal', 'error');
    }
  };

  return (
    <section className="space-y-5">
      <h3 className="text-base font-semibold">Jawaban ({answers.length})</h3>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Tulis jawaban</p>
        <MarkdownEditor value={content} onChange={setContent} minHeight="140px" />
        <ImageUploader images={images} onChange={setImages} onError={(m) => onToast(m, 'error')} />
        <div className="flex justify-end">
          <Button loading={submitting} onClick={submit}>
            Kirim jawaban
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : answers.length === 0 ? (
        <EmptyState title="Belum ada jawaban" description="Bantu jawab pertanyaan ini." />
      ) : (
        <div className="space-y-4">
          {answers.map((a) => {
            const canManage = profile?.id === a.user_id || profile?.role === 'owner';
            return (
              <div
                key={a.id}
                className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => vote(a.id, 1)}
                    className={cn(
                      'rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-violet-600 dark:hover:bg-zinc-800',
                      a.user_vote === 1 && 'text-violet-600 bg-violet-50 dark:bg-violet-950/40'
                    )}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold tabular-nums">
                    {(a.upvote_count || 0) - (a.downvote_count || 0)}
                  </span>
                  <button
                    onClick={() => vote(a.id, -1)}
                    className={cn(
                      'rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800',
                      a.user_vote === -1 && 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                    )}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Link to={`/u/${a.author?.username || ''}`} className="flex items-center gap-2">
                      <Avatar src={a.author?.avatar_url} name={a.author?.nickname} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{a.author?.nickname}</p>
                        <p className="text-xs text-zinc-400">{timeAgo(a.created_at)}</p>
                      </div>
                    </Link>
                    {canManage && (
                      <button
                        onClick={() => remove(a.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <MarkdownRenderer content={a.content} />
                  {a.images?.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {a.images.map((img) => (
                        <img key={img} src={img} alt="" className="rounded-xl object-cover h-36 w-full" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
