import supabase from './db-client.js';
import {
  handleOptions,
  cors,
  getAuthUser,
  requireUser,
  sanitizeText,
  parseImages,
  rateLimit,
  attachAuthors,
  createNotification,
} from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      const postId = Number(req.query.post_id);
      if (!postId) return res.status(400).json({ error: 'post_id diperlukan' });

      const { data, error } = await supabase
        .from('question_answers')
        .select('*')
        .eq('post_id', postId)
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;

      let rows = await attachAuthors(data || []);
      const { user } = await getAuthUser(req);
      if (user && rows.length) {
        const ids = rows.map((r) => r.id);
        const { data: votes } = await supabase
          .from('votes')
          .select('answer_id, value')
          .eq('user_id', user.id)
          .in('answer_id', ids);
        const map = Object.fromEntries((votes || []).map((v) => [v.answer_id, v.value]));
        rows = rows.map((r) => ({
          ...r,
          images: Array.isArray(r.images) ? r.images : [],
          user_vote: map[r.id] ?? null,
        }));
      } else {
        rows = rows.map((r) => ({
          ...r,
          images: Array.isArray(r.images) ? r.images : [],
          user_vote: null,
        }));
      }
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      if (!rateLimit(`answer:${auth.user.id}`, 30)) {
        return res.status(429).json({ error: 'Terlalu banyak permintaan' });
      }

      const post_id = Number(req.body?.post_id);
      const content = sanitizeText(req.body?.content || '').slice(0, 20000);
      const images = parseImages(req.body?.images);
      if (!post_id) return res.status(400).json({ error: 'post_id diperlukan' });
      if (content.length < 5) return res.status(400).json({ error: 'Jawaban minimal 5 karakter' });

      const { data: post } = await supabase.from('posts').select('*').eq('id', post_id).maybeSingle();
      if (!post || post.type !== 'question') {
        return res.status(400).json({ error: 'Pertanyaan tidak valid' });
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('question_answers')
        .insert({
          post_id,
          user_id: auth.user.id,
          content,
          images,
          upvote_count: 0,
          downvote_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from('posts')
        .update({ answer_count: (post.answer_count || 0) + 1 })
        .eq('id', post_id);

      await createNotification({
        userId: post.user_id,
        actorId: auth.user.id,
        type: 'answer',
        entityType: 'answer',
        entityId: data.id,
        postSlug: post.slug,
        message: `${auth.profile.nickname || auth.profile.username} menjawab pertanyaanmu`,
      });

      const [withAuthor] = await attachAuthors([data]);
      return res.status(201).json({ ...withAuthor, images, user_vote: null });
    }

    if (req.method === 'PUT') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const id = Number(req.body?.id);
      const content = sanitizeText(req.body?.content || '').slice(0, 20000);
      if (!id) return res.status(400).json({ error: 'id diperlukan' });
      if (content.length < 5) return res.status(400).json({ error: 'Jawaban minimal 5 karakter' });

      const { data: existing } = await supabase.from('question_answers').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Jawaban tidak ditemukan' });
      if (existing.user_id !== auth.user.id && auth.profile.role !== 'owner') {
        return res.status(403).json({ error: 'Tidak diizinkan' });
      }

      const updates = {
        content,
        updated_at: new Date().toISOString(),
      };
      if (req.body?.images !== undefined) updates.images = parseImages(req.body.images);

      const { data, error } = await supabase.from('question_answers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      const [withAuthor] = await attachAuthors([data]);
      return res.status(200).json({ ...withAuthor, images: data.images || [], user_vote: null });
    }

    if (req.method === 'DELETE') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: 'id diperlukan' });

      const { data: existing } = await supabase.from('question_answers').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Jawaban tidak ditemukan' });
      if (existing.user_id !== auth.user.id && auth.profile.role !== 'owner') {
        return res.status(403).json({ error: 'Tidak diizinkan' });
      }

      await supabase.from('votes').delete().eq('answer_id', id);
      await supabase.from('question_answers').delete().eq('id', id);

      const { data: post } = await supabase.from('posts').select('answer_count').eq('id', existing.post_id).maybeSingle();
      if (post) {
        await supabase
          .from('posts')
          .update({ answer_count: Math.max(0, (post.answer_count || 1) - 1) })
          .eq('id', existing.post_id);
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('answers error:', err);
    return res.status(500).json({ error: err.message });
  }
}
