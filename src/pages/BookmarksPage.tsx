import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { Post } from '../lib/types';
import PostCard from '../components/posts/PostCard';
import { FeedSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function BookmarksPage() {
  const { token, loading, requireAuth } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!requireAuth()) {
      setBusy(false);
      return;
    }
    if (!token) return;
    api
      .getBookmarks(token)
      .then(setPosts)
      .catch(console.error)
      .finally(() => setBusy(false));
  }, [token, loading, requireAuth]);

  if (busy) return <FeedSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tersimpan</h1>
        <p className="mt-1 text-sm text-zinc-500">Postingan yang kamu bookmark.</p>
      </div>
      {posts.length === 0 ? (
        <EmptyState
          title="Belum ada bookmark"
          description="Simpan postingan menarik agar mudah ditemukan lagi."
          action={
            <Link to="/">
              <Button variant="outline">Jelajahi beranda</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
