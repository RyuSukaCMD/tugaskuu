import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">TugasKu</p>
            <p className="text-xs text-zinc-400">Platform berbagi jawaban & penjelasan tugas</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
          <Link to="/" className="hover:text-violet-600">Beranda</Link>
          <Link to="/explore" className="hover:text-violet-600">Jelajahi</Link>
          <Link to="/create" className="hover:text-violet-600">Buat</Link>
        </div>
      </div>
    </footer>
  );
}
