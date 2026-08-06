import supabase from './db-client.js';

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

const rateMap = new Map();

export function rateLimit(key, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const entry = rateMap.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  rateMap.set(key, entry);
  return entry.count <= limit;
}

export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function slugify(title) {
  const base = String(title || 'post')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'post';
  return `${base}-${Date.now().toString(36)}`;
}

export async function getAuthUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return { user: null, token: null };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null, token: null };
  return { user: data.user, token };
}

export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}

export async function requireUser(req, res) {
  const { user } = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Login diperlukan' });
    return null;
  }
  const profile = await getProfile(user.id);
  if (!profile) {
    res.status(401).json({ error: 'Profil belum dibuat' });
    return null;
  }
  return { user, profile };
}

export async function requireOwner(req, res) {
  const auth = await requireUser(req, res);
  if (!auth) return null;
  if (auth.profile.role !== 'owner') {
    res.status(403).json({ error: 'Akses owner diperlukan' });
    return null;
  }
  return auth;
}

export function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 10);
  }
  if (typeof tags === 'string') {
    return tags
      .split(/[,#\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);
  }
  return [];
}

export function parseImages(images) {
  if (!Array.isArray(images)) return [];
  return images.filter((u) => typeof u === 'string' && u.length < 2000).slice(0, 10);
}

export async function attachAuthors(rows, userKey = 'user_id') {
  if (!rows?.length) return rows || [];
  const ids = [...new Set(rows.map((r) => r[userKey]).filter(Boolean))];
  if (!ids.length) return rows.map((r) => ({ ...r, author: null }));
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, author: map[r[userKey]] || null }));
}

export async function enrichPosts(posts, viewerId) {
  if (!posts?.length) return [];
  let withAuthors = await attachAuthors(posts);
  withAuthors = withAuthors.map((p) => ({
    ...p,
    tags: Array.isArray(p.tags) ? p.tags : [],
    images: Array.isArray(p.images) ? p.images : [],
    liked: false,
    bookmarked: false,
  }));

  if (!viewerId) return withAuthors;

  const ids = withAuthors.map((p) => p.id);
  const [{ data: likes }, { data: bookmarks }] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('user_id', viewerId).in('post_id', ids),
    supabase.from('bookmarks').select('post_id').eq('user_id', viewerId).in('post_id', ids),
  ]);
  const likeSet = new Set((likes || []).map((l) => l.post_id));
  const bmSet = new Set((bookmarks || []).map((b) => b.post_id));
  return withAuthors.map((p) => ({
    ...p,
    liked: likeSet.has(p.id),
    bookmarked: bmSet.has(p.id),
  }));
}

export async function createNotification({
  userId,
  actorId,
  type,
  entityType,
  entityId,
  postSlug,
  message,
}) {
  if (!userId || userId === actorId) return;
  await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId || null,
    type,
    entity_type: entityType || null,
    entity_id: entityId || null,
    post_slug: postSlug || null,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
  });
}

export async function notifyMentions(text, actorId, actorName, postSlug, entityType, entityId) {
  const mentions = [...new Set((String(text).match(/@([a-zA-Z0-9_]+)/g) || []).map((m) => m.slice(1).toLowerCase()))];
  if (!mentions.length) return;
  const { data: users } = await supabase.from('profiles').select('id, username').in('username', mentions);
  for (const u of users || []) {
    await createNotification({
      userId: u.id,
      actorId,
      type: 'mention',
      entityType,
      entityId,
      postSlug,
      message: `${actorName} menyebutmu dalam ${entityType === 'comment' ? 'komentar' : 'postingan'}`,
    });
  }
}

export function usernameFromEmail(email, name) {
  const base = (name || email?.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 16) || 'user';
  return `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
}
