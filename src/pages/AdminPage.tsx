import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { Profile } from '../lib/types';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { FeedSkeleton } from '../components/ui/Skeleton';
import ToastStack from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../lib/utils';

export default function AdminPage() {
  const { token, profile, loading, requireAuth } = useAuth();
  const { toasts, push } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(true);

  const load = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const data = await api.getUsers(token);
      setUsers(data);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal memuat user', 'error');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!requireAuth()) {
      setBusy(false);
      return;
    }
    if (profile?.role !== 'owner') {
      setBusy(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading, profile?.role]);

  if (!loading && profile && profile.role !== 'owner') {
    return (
      <EmptyState
        title="Akses terbatas"
        description="Halaman ini hanya untuk owner."
      />
    );
  }

  if (busy) return <FeedSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kelola user</h1>
        <p className="mt-1 text-sm text-zinc-500">Owner dapat mengatur role dan menghapus akun.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={u.avatar_url} name={u.nickname} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{u.nickname}</p>
                    <Badge tone={u.role === 'owner' ? 'violet' : 'neutral'}>{u.role}</Badge>
                  </div>
                  <p className="truncate text-xs text-zinc-400">
                    @{u.username} · {u.email} · {formatDate(u.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.role !== 'owner' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!token) return;
                      try {
                        await api.updateUserRole(token, u.id, 'owner');
                        push('Role diperbarui', 'success');
                        load();
                      } catch (e) {
                        push(e instanceof Error ? e.message : 'Gagal', 'error');
                      }
                    }}
                  >
                    Jadikan owner
                  </Button>
                ) : u.id !== profile?.id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!token) return;
                      try {
                        await api.updateUserRole(token, u.id, 'user');
                        push('Role diturunkan', 'success');
                        load();
                      } catch (e) {
                        push(e instanceof Error ? e.message : 'Gagal', 'error');
                      }
                    }}
                  >
                    Jadikan user
                  </Button>
                ) : null}
                {u.id !== profile?.id && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (!token) return;
                      if (!confirm(`Hapus profil ${u.username}?`)) return;
                      try {
                        await api.deleteUser(token, u.id);
                        push('User dihapus', 'success');
                        load();
                      } catch (e) {
                        push(e instanceof Error ? e.message : 'Gagal', 'error');
                      }
                    }}
                  >
                    Hapus
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ToastStack toasts={toasts} />
    </div>
  );
}
