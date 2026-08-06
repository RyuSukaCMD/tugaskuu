import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar,
  ExternalLink,
  Github,
  GraduationCap,
  Heart,
  School,
  Settings,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Profile, ProfileStats } from '../lib/types';
import { formatDate } from '../lib/utils';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PostCard from '../components/posts/PostCard';
import ReportUserButton from '../components/posts/ReportUserButton';
import { FeedSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function ProfilePage() {
  const { username = '' } = useParams();
  const { token, profile: me } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<'all' | 'question' | 'answer'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getProfile({ username }, token)
      .then((data) => {
        if (!mounted) return;
        setProfile(data.profile);
        setStats(data.stats);
        setPosts(data.posts);
        document.title = `${data.profile.nickname} (@${data.profile.username}) · TugasKu`;
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Tidak ditemukan');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
      document.title = 'TugasKu';
    };
  }, [username, token]);

  if (loading) return <FeedSkeleton />;
  if (error || !profile || !stats) {
    return <EmptyState title="Profil tidak ditemukan" description={error} />;
  }

  const filtered =
    tab === 'all' ? posts : posts.filter((p) => p.type === tab);
  const isMe = me?.id === profile.id;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70">
        <div
          className="h-28 bg-gradient-to-r from-violet-600 via-blue-600 to-zinc-800 bg-cover bg-center"
          style={profile.banner_url ? { backgroundImage: `linear-gradient(rgba(37, 99, 235, .22), rgba(37, 99, 235, .22)), url(${profile.banner_url})` } : undefined}
        />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar src={profile.avatar_url} name={profile.nickname} size="xl" className="ring-4" />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold">{profile.nickname}</h1>
                  {profile.role === 'owner' && <Badge tone="violet">Owner</Badge>}
                </div>
                <p className="text-sm text-zinc-400">@{profile.username}</p>
              </div>
            </div>
            {isMe ? (
              <Link to="/settings"><Button variant="outline" size="sm"><Settings className="h-4 w-4" /> Edit profil</Button></Link>
            ) : me ? <ReportUserButton userId={profile.id} /> : null}
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
            {profile.school && (
              <span className="inline-flex items-center gap-1">
                <School className="h-3.5 w-3.5" /> {profile.school}
              </span>
            )}
            {(profile.education_level || profile.class_level) && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {[profile.education_level, profile.class_level].filter(Boolean).join(' · ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Bergabung {formatDate(profile.created_at)}
            </span>
          </div>

          {profile.favorite_subjects && profile.favorite_subjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.favorite_subjects.map((s) => (
                <Badge key={s} tone="soft">{s}</Badge>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {profile.social_links?.instagram && (
              <a className="text-violet-600 hover:underline" href={`https://instagram.com/${profile.social_links.instagram.replace('@','')}`} target="_blank" rel="noreferrer">
                Instagram
              </a>
            )}
            {profile.social_links?.twitter && (
              <a className="text-violet-600 hover:underline" href={`https://x.com/${profile.social_links.twitter.replace('@','')}`} target="_blank" rel="noreferrer">
                X/Twitter
              </a>
            )}
            {profile.social_links?.github && (
              <a className="inline-flex items-center gap-1 text-violet-600 hover:underline" href={`https://github.com/${profile.social_links.github}`} target="_blank" rel="noreferrer">
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
            {profile.social_links?.website && (
              <a className="inline-flex items-center gap-1 text-violet-600 hover:underline" href={profile.social_links.website.startsWith('http') ? profile.social_links.website : `https://${profile.social_links.website}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Website
              </a>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Postingan" value={stats.posts} />
            <Stat label="Pertanyaan" value={stats.questions} />
            <Stat label="Penjelasan" value={stats.answers} />
            <Stat label="Jawaban Q" value={stats.question_answers} />
            <Stat label="Total like" value={stats.total_likes} icon />
            <Stat label="Total upvote" value={stats.total_upvotes} />
          </div>
        </div>
      </section>

      <div className="flex gap-2">
        {(
          [
            ['all', 'Semua'],
            ['question', 'Pertanyaan'],
            ['answer', 'Jawaban'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              tab === id
                ? 'rounded-full bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white'
                : 'rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada postingan" description="Pengguna ini belum membagikan konten pada kategori ini." />
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-lg font-semibold tabular-nums">
        {icon && <Heart className="h-3.5 w-3.5 text-rose-500" />}
        {value}
      </p>
    </div>
  );
}
