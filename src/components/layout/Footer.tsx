import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../ui/BrandLogo';

export default function Footer() {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  return <footer className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80"><div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-2"><BrandLogo className="h-8 w-8 shrink-0" /><div><p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">TugasKu</p><p className="text-xs text-zinc-400">Platform berbagi jawaban & penjelasan tugas</p></div></div><div className="flex flex-wrap gap-4 text-xs text-zinc-500"><Link to="/" className="hover:text-violet-600">Beranda</Link><Link to="/explore" className="hover:text-violet-600">Jelajahi</Link><button type="button" onClick={() => requireAuth(() => navigate('/create'))} className="hover:text-violet-600">Buat</button></div></div></footer>;
}
