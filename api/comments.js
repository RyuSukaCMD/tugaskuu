import supabase from './db-client.js';
import {
  handleOptions,
  cors,
  getAuthUser,
  requireUser,
  sanitizeText,
  rateLimit,
  attachAuthors,
  createNotification,
  notifyMentions,
} from './_helpers.js';

function nestComments(flat) {
  const map = new Map();
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  const roots = [];
  map.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id).replies.push(c);
    } else if (!c.parent_id) {
      roots.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      const postId = Number(req.query.post_id);
      if (!postId) return res.status(400).json({ error: 'post_id diperlukan' });

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      let rows = await attachAuthors(data || []);
      const { user } = await getAuthUser(req);
      if (user && rows.length) {
        const ids = rows.map((r) => r.id);
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', ids);
        const set = new Set((likes || []).map((l) => l.comment_id));
        rows = rows.map((r) => ({ ...r, liked: set.has(r.id) }));
      } else {
        rows = rows.map((r) => ({ ...r, liked: false }));
      }

      return res.status(200).json(nestComments(rows));
    }

    if (req.method === 'POST') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      if (!rateLimit(`comment:${auth.user.id}`, 40)) {
        return res.status(429).json({ error: 'Terlalu banyak komentar' });
      }

      const post_id = Number(req.body?.post_id);
      const parent_id = req.body?.parent_id ? Number(req.body.parent_id) : null;
      const content = sanitizeText(req.body?.content || '').slice(0, 2000);
      if (!post_id) return res.status(400).json({ error: 'post_id diperlukan' });
      if (content.length < 1) return res.status(400).json({ error: 'Komentar kosong' });

      const { data: post } = await supabase.from('posts').select('*').eq('id', post_id).maybeSingle();
      if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });

      if (parent_id) {
        const { data: parent } = await supabase.from('comments').select('*').eq('id', parent_id).maybeSingle();
        if (!parent || parent.post_id !== post_id) {
          return res.status(400).json({ error: 'Parent komentar tidak valid' });
        }
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id,
          parent_id,
          user_id: auth.user.id,
          content,
          like_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from('posts')
        .update({ comment_count: (post.comment_count || 0) + 1 })
        .eq('id', post_id);

      const actorName = auth.profile.nickname || auth.profile.username;

      if (parent_id) {
        const { data: parent } = await supabase.from('comments').select('user_id').eq('id', parent_id).maybeSingle();
        if (parent) {
          await createNotification({
            userId: parent.user_id,
            actorId: auth.user.id,
            type: 'reply',
            entityType: 'comment',
            entityId: data.id,
            postSlug: post.slug,
            message: `${actorName} membalas komentarmu`,
          });
        }
      } else {
        await createNotification({
          userId: post.user_id,
          actorId: auth.user.id,
          type: 'comment',
          entityType: 'comment',
          entityId: data.id,
          postSlug: post.slug,
          message: `${actorName} mengomentari postinganmu`,
        });
      }

      await notifyMentions(content, auth.user.id, actorName, post.slug, 'comment', data.id);

      const [withAuthor] = await attachAuthors([data]);
      return res.status(201).json({ ...withAuthor, liked: false, replies: [] });
    }

    if (req.method === 'PUT') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const id = Number(req.body?.id);
      const content = sanitizeText(req.body?.content || '').slice(0, 2000);
      if (!id) return res.status(400).json({ error: 'id diperlukan' });
      if (!content) return res.status(400).json({ error: 'Komentar kosong' });

      const { data: existing } = await supabase.from('comments').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Komentar tidak ditemukan' });
      if (existing.user_id !== auth.user.id && auth.profile.role !== 'owner') {
        return res.status(403).json({ error: 'Tidak diizinkan' });
      }

      const { data, error } = await supabase
        .from('comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const [withAuthor] = await attachAuthors([data]);
      return res.status(200).json({ ...withAuthor, liked: false });
    }

    if (req.method === 'DELETE') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: 'id diperlukan' });

      const { data: existing } = await supabase.from('comments').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Komentar tidak ditemukan' });
      if (existing.user_id !== auth.user.id && auth.profile.role !== 'owner') {
        return res.status(403).json({ error: 'Tidak diizinkan' });
      }

      // delete nested replies first
      const { data: children } = await supabase.from('comments').select('id').eq('parent_id', id);
      const childIds = (children || []).map((c) => c.id);
      const allIds = [id, ...childIds];
      await supabase.from('comment_likes').delete().in('comment_id', allIds);
      if (childIds.length) await supabase.from('comments').delete().in('id', childIds);
      await supabase.from('comments').delete().eq('id', id);

      const { data: post } = await supabase.from('posts').select('comment_count').eq('id', existing.post_id).maybeSingle();
      if (post) {
        await supabase
          .from('posts')
          .update({ comment_count: Math.max(0, (post.comment_count || allIds.length) - allIds.length) })
          .eq('id', existing.post_id);
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('comments error:', err);
    return res.status(500).json({ error: err.message });
  }
}
