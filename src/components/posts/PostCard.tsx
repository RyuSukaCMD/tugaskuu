import { Link } from 'react-router-dom';
import {
  Bookmark,
  Heart,
  HelpCircle,
  MessageCircle,
  NotebookPen,
} from 'lucide-react';
import type { Post } from '../../lib/types';
import { cn, timeAgo } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

export default function PostCard({ post }: { post: Post }) {
  const excerpt =
    post.content.length > 180 ? `${post.content.slice(0, 180).trim()}…` : post.content;

  return (
    <article className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-violet-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Link to={`/u/${post.author?.username || ''}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={post.author?.avatar_url} name={post.author?.nickname} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {post.author?.nickname || 'Pengguna'}
            </p>
            <p className="text-xs text-zinc-400">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
        <Badge tone={post.type === 'question' ? 'blue' : 'violet'}>
          <span className="inline-flex items-center gap-1">
            {post.type === 'question' ? (
              <HelpCircle className="h-3 w-3" />
            ) : (
              <NotebookPen className="h-3 w-3" />
            )}
            {post.type === 'question' ? 'Pertanyaan' : 'Jawaban'}
          </span>
        </Badge>
      </div>

      <Link to={`/post/${post.slug}`} className="block space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 transition group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
          {post.title}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3 whitespace-pre-wrap">
          {excerpt}
        </p>
      </Link>

      {post.images?.length > 0 && (
        <Link to={`/post/${post.slug}`} className="mt-3 block">
          <div className={cn('grid overflow-hidden rounded-xl gap-2', post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
            {post.images.slice(0, 2).map((img) => (
              <img
                key={img}
                src={img}
                alt=""
                className="h-36 w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.01]"
                loading="lazy"
              />
            ))}
          </div>
        </Link>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="soft">{post.subject}</Badge>
        <Badge tone="soft">{post.education_level}</Badge>
        <Badge tone="soft">Kelas {post.class_level}</Badge>
        {post.tags?.slice(0, 3).map((t) => (
          <Badge key={t}>#{t}</Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" /> {post.like_count || 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {post.comment_count || 0}
        </span>
        {post.type === 'question' && (
          <span className="inline-flex items-center gap-1">
            <NotebookPen className="h-3.5 w-3.5" /> {post.answer_count || 0} jawaban
          </span>
        )}
        <span className="inline-flex items-center gap-1 ml-auto">
          <Bookmark className="h-3.5 w-3.5" /> {post.bookmark_count || 0}
        </span>
      </div>
    </article>
  );
}
