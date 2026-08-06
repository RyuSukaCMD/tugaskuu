import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  CLASS_OPTIONS,
  EDUCATION_LEVELS,
  SUBJECTS,
  type EducationLevel,
} from '../lib/constants';
import { cn } from '../lib/utils';
import MarkdownEditor from '../components/markdown/MarkdownEditor';
import ImageUploader from '../components/posts/ImageUploader';
import Button from '../components/ui/Button';
import ToastStack from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { useEffect } from 'react';

export default function CreatePostPage() {
  const { token, requireAuth, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toasts, push } = useToast();

  const [type, setType] = useState<'question' | 'answer'>(
    params.get('type') === 'answer' ? 'answer' : 'question'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [education_level, setLevel] = useState('');
  const [class_level, setClass] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) requireAuth();
  }, [loading, requireAuth]);

  const classOptions = useMemo(() => {
    if (!education_level || !EDUCATION_LEVELS.includes(education_level as EducationLevel)) return [];
    return CLASS_OPTIONS[education_level as EducationLevel];
  }, [education_level]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!token) return;

    setSubmitting(true);
    try {
      const post = await api.createPost(token, {
        type,
        title,
        content,
        subject,
        education_level,
        class_level,
        tags,
        images,
      });
      push('Postingan berhasil dibuat', 'success');
      navigate(`/post/${post.slug}`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal membuat postingan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buat postingan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Bagikan pertanyaan atau penjelasan jawaban dengan format yang rapi.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-7">
        <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {(['question', 'answer'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-medium transition',
                type === t
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white'
                  : 'text-zinc-500'
              )}
            >
              {t === 'question' ? 'Pertanyaan' : 'Jawaban / Penjelasan'}
            </button>
          ))}
        </div>

        <Field label="Judul">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Cara menghitung limit fungsi aljabar"
            className="field-input"
          />
        </Field>

        <Field label={type === 'question' ? 'Isi pertanyaan' : 'Penjelasan lengkap'}>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder={
              type === 'question'
                ? 'Jelaskan soalnya, apa yang sudah dicoba, dan bagian mana yang bingung...'
                : 'Tulis langkah demi langkah. Gunakan Markdown dan LaTeX, contoh $x^2 + y^2 = r^2$'
            }
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mata pelajaran">
            <select required value={subject} onChange={(e) => setSubject(e.target.value)} className="field-input">
              <option value="">Pilih</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Jenjang">
            <select
              required
              value={education_level}
              onChange={(e) => {
                setLevel(e.target.value);
                setClass('');
              }}
              className="field-input"
            >
              <option value="">Pilih</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Kelas">
            <select required value={class_level} onChange={(e) => setClass(e.target.value)} className="field-input" disabled={!classOptions.length}>
              <option value="">Pilih</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Tag" hint="Pisahkan dengan koma">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="limit, turunan, aljabar"
            className="field-input"
          />
        </Field>

        <ImageUploader images={images} onChange={setImages} onError={(m) => push(m, 'error')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Batal
          </Button>
          <Button type="submit" loading={submitting}>
            Publikasikan
          </Button>
        </div>
      </form>
      <ToastStack toasts={toasts} />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
        {hint && <span className="text-xs font-normal text-zinc-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
