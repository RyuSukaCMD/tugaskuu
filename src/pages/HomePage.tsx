import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  CLASS_OPTIONS,
  EDUCATION_LEVELS,
  FEED_TABS,
  POST_TYPES,
  SUBJECTS,
  type EducationLevel,
} from '../lib/constants';
import type { Post } from '../lib/types';
import { cn } from '../lib/utils';
import PostCard from '../components/posts/PostCard';
import { FeedSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

export default function HomePage() {
  const { token, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'latest';
  const type = params.get('type') || 'all';
  const subject = params.get('subject') || '';
  const education_level = params.get('level') || '';
  const class_level = params.get('class') || '';
  const tag = params.get('tag') || '';
  const q = params.get('q') || '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const openCreate = (postType: 'question' | 'answer' = 'question') => {
    requireAuth(() => navigate(`/create?type=${postType}`));
  };

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key === 'level') next.delete('class');
    setParams(next);
  };

  const load = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const data = await api.getFeed(
          {
            page: pageNum,
            limit: 12,
            sort,
            type,
            subject,
            education_level,
            class_level,
            tag,
            q,
          },
          token
        );
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setHasMore(data.hasMore);
        setPage(pageNum);
      } catch (e) {
        console.error(e);
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, type, subject, education_level, class_level, tag, q, token]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const classOptions =
    education_level && EDUCATION_LEVELS.includes(education_level as EducationLevel)
      ? CLASS_OPTIONS[education_level as EducationLevel]
      : [];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-10">
        <div className="hero-gradient absolute inset-0 opacity-70" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="absolute -bottom-16 left-20 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Belajar bareng, jawab lebih jelas
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Temukan penjelasan tugas yang mudah dipahami
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-base">
            TugasKu membantu siswa dan mahasiswa berbagi pertanyaan, jawaban, serta penjelasan lengkap
            dengan dukungan Markdown dan LaTeX.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => openCreate('question')}>Tanya soal</Button>
            <Button variant="outline" onClick={() => openCreate('answer')}>
              Bagikan jawaban
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="sticky top-24 space-y-2 rounded-2xl border border-zinc-200/80 bg-white p-3 lg:space-y-4 lg:p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex translate-y-1 items-center justify-between lg:translate-y-0 lg:block">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Filter className="h-4 w-4 text-violet-600" /> Filter
              </h2>
              <button
                className="text-xs text-violet-600 lg:hidden"
                onClick={() => setFiltersOpen((v) => !v)}
              >
                {filtersOpen ? 'Tutup' : 'Buka'}
              </button>
            </div>

            <div className={cn(
              'space-y-4 overflow-hidden transition-all duration-300 ease-out lg:max-h-none lg:translate-y-0 lg:opacity-100 lg:overflow-visible lg:pr-0',
              filtersOpen ? 'mt-4 max-h-[52dvh] translate-y-0 overflow-y-auto pr-1 opacity-100' : 'max-h-0 -translate-y-1 opacity-0 pointer-events-none'
            )}>
              <FilterGroup label="Jenis">
                {POST_TYPES.map((t) => (
                  <Chip
                    key={t.id}
                    active={type === t.id}
                    onClick={() => setFilter('type', t.id)}
                    label={t.label}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label="Jenjang">
                <Chip active={!education_level} onClick={() => setFilter('level', '')} label="Semua" />
                {EDUCATION_LEVELS.map((l) => (
                  <Chip
                    key={l}
                    active={education_level === l}
                    onClick={() => setFilter('level', l)}
                    label={l}
                  />
                ))}
              </FilterGroup>

              {classOptions.length > 0 && (
                <FilterGroup label="Kelas">
                  <Chip active={!class_level} onClick={() => setFilter('class', '')} label="Semua" />
                  {classOptions.map((c) => (
                    <Chip
                      key={c}
                      active={class_level === c}
                      onClick={() => setFilter('class', c)}
                      label={c}
                    />
                  ))}
                </FilterGroup>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Mata pelajaran</label>
                <select
                  value={subject}
                  onChange={(e) => setFilter('subject', e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Semua</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Tag</label>
                <input
                  value={tag}
                  onChange={(e) => setFilter('tag', e.target.value.trim().toLowerCase())}
                  placeholder="contoh: limit"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              {(type !== 'all' || subject || education_level || class_level || tag || q) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setParams(new URLSearchParams())}
                >
                  Reset filter
                </Button>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
              {FEED_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter('sort', t.id === 'latest' ? '' : t.id)}
                  className={cn(
                    'rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
                    sort === t.id || (t.id === 'latest' && sort === 'latest')
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {q && (
              <p className="text-sm text-zinc-500">
                Hasil untuk <span className="font-medium text-zinc-800 dark:text-zinc-200">"{q}"</span>
              </p>
            )}
          </div>

          {loading ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState
              title="Belum ada postingan"
              description="Coba ubah filter atau buat postingan pertama."
              action={<Button onClick={() => openCreate()}>Buat postingan</Button>}
            />
          ) : (
            <>
              <div className="space-y-4">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    loading={loadingMore}
                    onClick={() => load(page + 1, true)}
                  >
                    Muat lebih banyak
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium transition',
        active
          ? 'bg-violet-600 text-white'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
      )}
    >
      {label}
    </button>
  );
}
