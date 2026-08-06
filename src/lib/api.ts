import { authHeaders } from './utils';
import type {
  Comment,
  Feedback,
  Notification,
  ModerationData,
  Post,
  Report,
  Profile,
  ProfileStats,
  QuestionAnswer,
  Subject,
} from './types';

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data as T;
}

export const api = {
  ensureProfile: (token: string, body?: Partial<Profile>) =>
    fetch('/api/profile', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body || {}),
    }).then((r) => handle<Profile>(r)),

  getProfile: (params: { id?: string; username?: string }, token?: string | null) => {
    const q = new URLSearchParams();
    if (params.id) q.set('id', params.id);
    if (params.username) q.set('username', params.username);
    return fetch(`/api/profile?${q}`, { headers: authHeaders(token) }).then((r) =>
      handle<{ profile: Profile; stats: ProfileStats; posts: Post[] }>(r)
    );
  },

  updateProfile: (token: string, body: Partial<Profile>) =>
    fetch('/api/profile', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<Profile>(r)),

  getSubjects: () => fetch('/api/posts?resource=subjects').then((r) => handle<Subject[]>(r)),

  createFeedback: (token: string, body: { category: Feedback['category']; message: string }) =>
    fetch('/api/profile?resource=feedback', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<Feedback>(r)),

  getFeedback: (token: string) =>
    fetch('/api/profile?resource=feedback', { headers: authHeaders(token) }).then((r) => handle<Feedback[]>(r)),

  createReport: (token: string, body: { post_id: number; reason: Report['reason']; details?: string }) =>
    fetch('/api/profile?resource=report', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) }).then((r) => handle<Report>(r)),

  getModeration: (token: string) =>
    fetch('/api/profile?resource=moderation', { headers: authHeaders(token) }).then((r) => handle<ModerationData>(r)),

  reviewReport: (token: string, id: number, action: 'takedown' | 'dismiss') =>
    fetch('/api/profile?resource=moderation', { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ id, action }) }).then((r) => handle<{ ok: true }>(r)),

  getFeed: (params: Record<string, string | number | undefined>, token?: string | null) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'all') q.set(k, String(v));
    });
    return fetch(`/api/posts?${q}`, { headers: authHeaders(token) }).then((r) =>
      handle<{ posts: Post[]; total: number; page: number; hasMore: boolean }>(r)
    );
  },

  getPost: (slugOrId: string, token?: string | null) =>
    fetch(`/api/post-detail?slug=${encodeURIComponent(slugOrId)}`, {
      headers: authHeaders(token),
    }).then((r) => handle<Post>(r)),

  createPost: (token: string, body: Record<string, unknown>) =>
    fetch('/api/posts', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<Post>(r)),

  updatePost: (token: string, body: Record<string, unknown>) =>
    fetch('/api/posts', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<Post>(r)),

  deletePost: (token: string, id: number) =>
    fetch('/api/posts', {
      method: 'DELETE',
      headers: authHeaders(token),
      body: JSON.stringify({ id }),
    }).then((r) => handle<{ ok: boolean }>(r)),

  getAnswers: (postId: number, token?: string | null) =>
    fetch(`/api/answers?post_id=${postId}`, { headers: authHeaders(token) }).then((r) =>
      handle<QuestionAnswer[]>(r)
    ),

  createAnswer: (token: string, body: Record<string, unknown>) =>
    fetch('/api/answers', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<QuestionAnswer>(r)),

  updateAnswer: (token: string, body: Record<string, unknown>) =>
    fetch('/api/answers', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<QuestionAnswer>(r)),

  deleteAnswer: (token: string, id: number) =>
    fetch('/api/answers', {
      method: 'DELETE',
      headers: authHeaders(token),
      body: JSON.stringify({ id }),
    }).then((r) => handle<{ ok: boolean }>(r)),

  getComments: (postId: number, token?: string | null) =>
    fetch(`/api/comments?post_id=${postId}`, { headers: authHeaders(token) }).then((r) =>
      handle<Comment[]>(r)
    ),

  createComment: (token: string, body: Record<string, unknown>) =>
    fetch('/api/comments', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<Comment>(r)),

  updateComment: (token: string, body: Record<string, unknown>) =>
    fetch('/api/comments', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => handle<Comment>(r)),

  deleteComment: (token: string, id: number) =>
    fetch('/api/comments', {
      method: 'DELETE',
      headers: authHeaders(token),
      body: JSON.stringify({ id }),
    }).then((r) => handle<{ ok: boolean }>(r)),

  togglePostLike: (token: string, postId: number) =>
    fetch('/api/likes', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ type: 'post', id: postId }),
    }).then((r) => handle<{ liked: boolean; count: number }>(r)),

  toggleCommentLike: (token: string, commentId: number) =>
    fetch('/api/likes', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ type: 'comment', id: commentId }),
    }).then((r) => handle<{ liked: boolean; count: number }>(r)),

  voteAnswer: (token: string, answerId: number, value: 1 | -1) =>
    fetch('/api/votes', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ answer_id: answerId, value }),
    }).then((r) =>
      handle<{ user_vote: number | null; upvote_count: number; downvote_count: number }>(r)
    ),

  toggleBookmark: (token: string, postId: number) =>
    fetch('/api/bookmarks', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ post_id: postId }),
    }).then((r) => handle<{ bookmarked: boolean; count: number }>(r)),

  getBookmarks: (token: string) =>
    fetch('/api/bookmarks', { headers: authHeaders(token) }).then((r) => handle<Post[]>(r)),

  getNotifications: (token: string) =>
    fetch('/api/notifications', { headers: authHeaders(token) }).then((r) =>
      handle<Notification[]>(r)
    ),

  markNotificationsRead: (token: string, ids?: number[]) =>
    fetch('/api/notifications', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ ids }),
    }).then((r) => handle<{ ok: boolean }>(r)),

  uploadImage: (token: string, fileName: string, fileBase64: string, contentType: string) =>
    fetch('/api/upload', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ fileName, fileBase64, contentType }),
    }).then((r) => handle<{ url: string }>(r)),

  getUsers: (token: string) =>
    fetch('/api/users', { headers: authHeaders(token) }).then((r) => handle<Profile[]>(r)),

  updateUserRole: (token: string, userId: string, role: string) =>
    fetch('/api/users', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ id: userId, role }),
    }).then((r) => handle<Profile>(r)),

  deleteUser: (token: string, userId: string) =>
    fetch('/api/users', {
      method: 'DELETE',
      headers: authHeaders(token),
      body: JSON.stringify({ id: userId }),
    }).then((r) => handle<{ ok: boolean }>(r)),
};
