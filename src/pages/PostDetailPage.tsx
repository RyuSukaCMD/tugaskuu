import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../lib/types';
import { formatDate, timeAgo } from '../lib/utils';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import MarkdownRenderer from '../components/markdown/MarkdownRenderer';
import PostActions from '../components/posts/PostActions';
import CommentSection from '../components/comments/CommentSection';
import AnswerList from '../components/posts/AnswerList';
import ToastStack from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import MarkdownEditor from '../components/markdown/MarkdownEditor';
import ImageUploader from '../components/posts/ImageUploader';
import { SUBJECTS, EDUCATION_LEVELS, CLASS_OPTIONS, type EducationLevel } from '../lib/constants';

export default function PostDetailPage() {
  const { slug = '' } = useParams();
  const { token, profile } = useAuth();
  const navigate = useNavigate();
  const { toasts, push } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    subject: '',
    education_level: '',
    class_level: '',
    tags: '',
    images: [] as string[],
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getPost(slug, token);
      setPost(data);
      document.title = `${data.title} · TugasKu`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tidak ditemukan');
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      document.title = 'TugasKu';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  const canManage = post && profile && (profile.id === post.user_id || profile.role === 'owner');

  const openEdit = () => {
    if (!post) return;
    setForm({
      title: post.title,
      content: post.content,
      subject: post.subject,
      education_level: post.education_level,
      class_level: post.class_level,
      tags: (post.tags || []).join(', '),
      images: post.images || [],
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!token || !post) return;
    setSaving(true);
    try {
      const updated = await api.updatePost(token, { id: post.id, ...form });
      setPost(updated);
      setEditOpen(false);
      push('Postingan diperbarui', 'success');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!token || !post) return;
    if (!confirm('Hapus postingan ini beserta komentar dan jawabannya?')) return;
    try {
      await api.deletePost(token, post.id);
      push('Postingan dihapus', 'success');
      navigate('/');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menghapus', 'error');
    }
  };

  if (loading) return <PostCardSkeleton />;
  if (error || !post) {
    return (
      <EmptyState
        title="Postingan tidak ditemukan"
        description={error || 'Mungkin tautannya sudah berubah atau dihapus.'}
        action={
          <Link to="/">
            <Button variant="outline">Kembali ke beranda</Button>
          </Link>
        }
      />
    );
  }

  const classOptions =
    form.education_level && EDUCATION_LEVELS.includes(form.education_level as EducationLevel)
      ? CLASS_OPTIONS[form.education_level as EducationLevel]
      : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <article className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to={`/u/${post.author?.username || ''}`}>
              <Avatar src={post.author?.avatar_url} name={post.author?.nickname} />
            </Link>
            <div>
              <Link
                to={`/u/${post.author?.username || ''}`}
                className="text-sm font-medium hover:text-violet-600"
              >
                {post.author?.nickname}
              </Link>
              <p className="text-xs text-zinc-400">
                @{post.author?.username} · {timeAgo(post.created_at)} · {formatDate(post.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={post.type === 'question' ? 'blue' : 'violet'}>
              {post.type === 'question' ? 'Pertanyaan' : 'Jawaban'}
            </Badge>
            {canManage && (
              <>
                <button onClick={openEdit} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={remove} className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            {post.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="soft">{post.subject}</Badge>
            <Badge tone="soft">{post.education_level}</Badge>
            <Badge tone="soft">Kelas {post.class_level}</Badge>
            {post.tags?.map((t) => (
              <Link key={t} to={`/?tag=${encodeURIComponent(t)}`}>
                <Badge>#{t}</Badge>
              </Link>
            ))}
          </div>
        </div>

        <MarkdownRenderer content={post.content} />

        {post.images?.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {post.images.map((img) => (
              <a key={img} href={img} target="_blank" rel="noreferrer">
                <img src={img} alt="" className="h-56 w-full rounded-2xl object-cover" />
              </a>
            ))}
          </div>
        )}

        <PostActions
          post={post}
          onChange={(partial) => setPost((p) => (p ? { ...p, ...partial } : p))}
          onToast={push}
        />
      </article>

      {post.type === 'question' && (
        <AnswerList
          postId={post.id}
          onCountChange={(d) =>
            setPost((p) => (p ? { ...p, answer_count: Math.max(0, (p.answer_count || 0) + d) } : p))
          }
          onToast={push}
        />
      )}

      <CommentSection
        postId={post.id}
        onCountChange={(d) =>
          setPost((p) => (p ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + d) } : p))
        }
        onToast={push}
      />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit postingan" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="field-input"
            placeholder="Judul"
          />
          <MarkdownEditor
            value={form.content}
            onChange={(content) => setForm((f) => ({ ...f, content }))}
            minHeight="160px"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="field-input"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={form.education_level}
              onChange={(e) => setForm((f) => ({ ...f, education_level: e.target.value, class_level: '' }))}
              className="field-input"
            >
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              value={form.class_level}
              onChange={(e) => setForm((f) => ({ ...f, class_level: e.target.value }))}
              className="field-input"
            >
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="field-input"
            placeholder="tag1, tag2"
          />
          <ImageUploader
            images={form.images}
            onChange={(images) => setForm((f) => ({ ...f, images }))}
            onError={(m) => push(m, 'error')}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button loading={saving} onClick={saveEdit}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <ToastStack toasts={toasts} />
    </div>
  );
}
