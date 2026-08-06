import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../lib/api';
import { cn, timeAgo } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import BrandLogo from '../ui/BrandLogo';
import type { Notification } from '../../lib/types';

export default function Navbar() {
  const { user, profile, token, requireAuth, signOut, setLoginOpen } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!token) {
      setNotifs([]);
      return;
    }
    api.getNotifications(token).then(setNotifs).catch(console.error);
    const t = setInterval(() => {
      api.getNotifications(token).then(setNotifs).catch(() => undefined);
    }, 45000);
    return () => clearInterval(t);
  }, [token]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/?q=${encodeURIComponent(term)}` : '/');
    setMobileOpen(false);
  };

  const openNotifs = async () => {
    setNotifOpen((v) => !v);
    setMenuOpen(false);
    if (!token) return;
    try {
      const list = await api.getNotifications(token);
      setNotifs(list);
      if (list.some((n) => !n.is_read)) {
        await api.markNotificationsRead(token);
        setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch {
      /* ignore */
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors',
      isActive
        ? 'text-violet-700 dark:text-violet-300'
        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
    );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <BrandLogo className="h-9 w-9 shrink-0" />
          <span className="hidden text-lg font-semibold tracking-tight text-zinc-900 min-[380px]:inline dark:text-white">
            Tugas<span className="text-violet-600 dark:text-violet-400">Ku</span>
          </span>
        </Link>

        <form onSubmit={onSearch} className="relative mx-2 hidden flex-1 md:block max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari soal, jawaban, topik..."
            className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-5 md:flex">
          <NavLink to="/" end className={linkClass}>
            Beranda
          </NavLink>
          <NavLink to="/explore" className={linkClass}>
            Jelajahi
          </NavLink>
          {profile && (
            <NavLink to="/bookmarks" className={linkClass}>
              Tersimpan
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5 md:ml-3">
          <button
            onClick={toggleTheme}
            className="hidden rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 sm:inline-flex dark:hover:bg-zinc-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => requireAuth(() => navigate('/create'))}
          >
            <Plus className="h-4 w-4" />
            Buat
          </Button>

          {user && profile ? (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={openNotifs}
                  className="relative rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100 sm:p-2 dark:hover:bg-zinc-800"
                  aria-label="Notifikasi"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-100 px-4 py-3 text-sm font-medium dark:border-zinc-800">
                      Notifikasi
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada notifikasi</p>
                      ) : (
                        notifs.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              setNotifOpen(false);
                              if (n.post_slug) navigate(`/post/${n.post_slug}`);
                            }}
                            className={cn(
                              'flex w-full gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                              !n.is_read && 'bg-violet-50/60 dark:bg-violet-950/20'
                            )}
                          >
                            <Avatar src={n.actor?.avatar_url} name={n.actor?.nickname} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-zinc-700 dark:text-zinc-200">{n.message}</p>
                              <p className="mt-0.5 text-xs text-zinc-400">{timeAgo(n.created_at)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  className="shrink-0 rounded-full"
                  aria-label="Buka profil"
                >
                  <Avatar src={profile.avatar_url} name={profile.nickname} size="sm" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                      <p className="truncate text-sm font-medium">{profile.nickname}</p>
                      <p className="truncate text-xs text-zinc-400">@{profile.username}</p>
                    </div>
                    <MenuItem
                      icon={User}
                      label="Profil"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(`/u/${profile.username}`);
                      }}
                    />
                    <MenuItem
                      icon={Settings}
                      label="Edit profil"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/settings');
                      }}
                    />
                    <MenuItem
                      icon={Bookmark}
                      label="Tersimpan"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/bookmarks');
                      }}
                    />
                    {profile.role === 'owner' && (
                      <MenuItem
                        icon={Users}
                        label="Kelola user"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/admin');
                        }}
                      />
                    )}
                    <MenuItem
                      icon={LogOut}
                      label="Keluar"
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut();
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setLoginOpen(true)}>
              Masuk
            </Button>
          )}

          <button
            className="shrink-0 rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100 sm:p-2 md:hidden dark:hover:bg-zinc-800"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
          <form onSubmit={onSearch} className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />
          </form>
          <div className="flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Beranda
            </Link>
            <Link to="/explore" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Jelajahi
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                requireAuth(() => navigate('/create'));
              }}
              className="rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Buat postingan
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <Icon className="h-4 w-4 text-zinc-400" />
      {label}
    </button>
  );
}
