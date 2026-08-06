import { Link } from 'react-router-dom';
import { SUBJECTS, EDUCATION_LEVELS } from '../lib/constants';
import { BookMarked, GraduationCap } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jelajahi</h1>
        <p className="mt-1 text-sm text-zinc-500">Telusuri berdasarkan mata pelajaran dan jenjang.</p>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <BookMarked className="h-4 w-4 text-violet-600" /> Mata pelajaran
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((s) => (
            <Link
              key={s}
              to={`/?subject=${encodeURIComponent(s)}`}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium transition hover:border-violet-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
            >
              {s}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <GraduationCap className="h-4 w-4 text-blue-600" /> Jenjang
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {EDUCATION_LEVELS.map((l) => (
            <Link
              key={l}
              to={`/?level=${encodeURIComponent(l)}`}
              className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 px-4 py-6 text-center text-sm font-semibold transition hover:border-blue-300 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/40 dark:hover:border-blue-800"
            >
              {l}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
