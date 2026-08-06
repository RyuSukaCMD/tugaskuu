import { BarChart3, FileText, Flag, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { Feedback, ModerationData, Profile, Report } from '../lib/types';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { FeedSkeleton } from '../components/ui/Skeleton';
import ToastStack from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { cn, formatDate } from '../lib/utils';

type Tab = 'overview' | 'reports' | 'feedback' | 'users';
const reportLabels: Record<Report['reason'], string> = { spam: 'Spam', harassment: 'Pelecehan', misinformation: 'Misleading', copyright: 'Hak cipta', other: 'Lainnya' };

export default function AdminPage() {
  const { token, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toasts, push } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [moderation, setModeration] = useState<ModerationData | null>(null);
  const [busy, setBusy] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const [userData, feedbackData, moderationData] = await Promise.all([api.getUsers(token), api.getFeedback(token), api.getModeration(token)]);
      setUsers(userData); setFeedback(feedbackData); setModeration(moderationData);
    } catch (error) {
      push(error instanceof Error ? error.message : 'Gagal memuat data admin', 'error');
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (loading) return;
    if (!token || !profile || profile.role !== 'owner') { navigate('/', { replace: true }); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading, profile?.role, navigate]);

  const review = async (id: number, action: 'takedown' | 'dismiss') => {
    if (!token) return;
    setActingId(id);
    try { await api.reviewReport(token, id, action); push(action === 'takedown' ? 'Post ditakedown.' : 'Report ditandai false report.', 'success'); await load(); }
    catch (error) { push(error instanceof Error ? error.message : 'Aksi gagal', 'error'); }
    finally { setActingId(null); }
  };

  if (loading || !token || !profile || profile.role !== 'owner' || busy || !moderation) return <FeedSkeleton />;
  const { stats, reports } = moderation;
  const cards = [
    { label: 'Total user', value: stats.users, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300' },
    { label: 'Post aktif', value: stats.posts, icon: FileText, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-300' },
    { label: 'Report terbuka', value: stats.openReports, icon: Flag, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300' },
    { label: 'Post ditakedown', value: stats.removedPosts, icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300' },
  ];

  return <div className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-violet-600">Control center</p><h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1><p className="mt-1 text-sm text-zinc-500">Moderasi komunitas dan pantau perkembangan TugasKu.</p></div><Button variant="outline" onClick={load}>Muat ulang</Button></header>

    <nav className="flex overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
      {([{ id: 'overview', label: 'Overview', icon: BarChart3 }, { id: 'reports', label: `Report ${stats.openReports ? `(${stats.openReports})` : ''}`, icon: Flag }, { id: 'feedback', label: 'Masukan', icon: MessageSquare }, { id: 'users', label: 'User', icon: Users }] as const).map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cn('flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4', tab === id ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}><Icon className="h-4 w-4" />{label}</button>)}
    </nav>

    {tab === 'overview' && <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <article key={label} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-start justify-between"><div><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div><div className={cn('rounded-xl p-2.5', color)}><Icon className="h-5 w-5" /></div></div></article>)}</section>
      <section className="grid gap-4 lg:grid-cols-5"><div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-3 dark:border-zinc-800 dark:bg-zinc-900"><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">Ringkasan komunitas</h2><span className="text-xs text-zinc-400">Data saat ini</span></div><div className="flex h-44 items-end gap-5 px-2">{[{ label: 'User', value: stats.users, tone: 'bg-blue-500' }, { label: 'Post', value: stats.posts, tone: 'bg-violet-500' }, { label: 'Report', value: stats.reports, tone: 'bg-rose-500' }, { label: 'Takedown', value: stats.removedPosts, tone: 'bg-amber-500' }].map((item) => <div key={item.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-medium">{item.value}</span><div className="flex h-28 w-full items-end rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"><div className={cn('w-full rounded-md transition-all', item.tone)} style={{ height: `${Math.max(8, (item.value / Math.max(stats.users, stats.posts, stats.reports, stats.removedPosts, 1)) * 100)}%` }} /></div><span className="text-xs text-zinc-500">{item.label}</span></div>)}</div></div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-semibold">Perlu ditinjau</h2><p className="mt-1 text-sm text-zinc-500">Laporan yang membutuhkan tindakan.</p><p className="mt-6 text-4xl font-semibold text-rose-600">{stats.openReports}</p><Button className="mt-5 w-full" variant="outline" onClick={() => setTab('reports')}>Buka report</Button></div></section></>}

    {tab === 'reports' && <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800"><h2 className="font-semibold">Moderasi report</h2><p className="text-sm text-zinc-500">Takedown menyembunyikan post dari feed. False report menutup laporan tanpa menghapus post.</p></div><div className="divide-y divide-zinc-100 dark:divide-zinc-800">{reports.length === 0 ? <p className="p-10 text-center text-sm text-zinc-400">Belum ada report.</p> : reports.map((report) => <article key={report.id} className="space-y-3 p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><Badge tone={report.status === 'open' ? 'blue' : report.status === 'actioned' ? 'violet' : 'neutral'}>{report.status === 'open' ? reportLabels[report.reason] : report.status === 'actioned' ? 'Ditakedown' : 'False report'}</Badge><span className="text-xs text-zinc-400">{formatDate(report.created_at)}</span><span className="text-xs text-zinc-500">oleh @{report.reporter?.username || 'pengguna'}</span></div><div><p className="font-medium">{report.post?.title || 'Post sudah dihapus'}</p>{report.details && <p className="mt-1 text-sm text-zinc-500">{report.details}</p>}</div>{report.status === 'open' && <div className="flex flex-wrap gap-2"><Button size="sm" variant="danger" loading={actingId === report.id} onClick={() => review(report.id, 'takedown')}>Takedown post</Button><Button size="sm" variant="outline" disabled={actingId === report.id} onClick={() => review(report.id, 'dismiss')}>False report</Button></div>}</article>)}</div></section>}

    {tab === 'feedback' && <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800"><h2 className="font-semibold">Masukan pengguna</h2></div><div className="divide-y divide-zinc-100 dark:divide-zinc-800">{feedback.length === 0 ? <p className="p-10 text-center text-sm text-zinc-400">Belum ada masukan.</p> : feedback.map((item) => <article key={item.id} className="space-y-2 p-5"><div className="flex flex-wrap items-center gap-2"><Badge tone={item.category === 'bug' ? 'blue' : item.category === 'idea' ? 'violet' : 'neutral'}>{item.category}</Badge><span className="text-xs text-zinc-400">{formatDate(item.created_at)}</span><span className="text-xs text-zinc-500">@{item.user?.username || 'pengguna'}</span></div><p className="whitespace-pre-wrap text-sm leading-relaxed">{item.message}</p></article>)}</div></section>}

    {tab === 'users' && <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="divide-y divide-zinc-100 dark:divide-zinc-800">{users.map((u) => <div key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><Avatar src={u.avatar_url} name={u.nickname} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium">{u.nickname}</p><Badge tone={u.role === 'owner' ? 'violet' : 'neutral'}>{u.role}</Badge></div><p className="truncate text-xs text-zinc-400">@{u.username} · {u.email}</p></div></div>{u.id !== profile.id && <Button size="sm" variant="danger" onClick={async () => { if (!confirm(`Hapus profil ${u.username}?`)) return; try { await api.deleteUser(token, u.id); push('User dihapus', 'success'); load(); } catch (e) { push(e instanceof Error ? e.message : 'Gagal', 'error'); } }}>Hapus</Button>}</div>)}</div></section>}
    <ToastStack toasts={toasts} />
  </div>;
}
