import supabase from '../server/db-client.js';
import {
  handleOptions,
  cors,
  getAuthUser,
  requireUser,
  sanitizeText,
  slugify,
  parseTags,
  parseImages,
  rateLimit,
  enrichPosts,
  notifyMentions,
} from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      // Kept here to stay within Vercel Hobby's 12-function limit.
      if (req.query.resource === 'subjects') {
        const { data, error } = await supabase.from('subjects').select('*').order('name', { ascending: true });
        if (error) throw error;
        return res.status(200).json(data || []);
      }

      const {
        page = '1',
        limit = '12',
        sort = 'latest',
        type,
        subject,
        education_level,
        class_level,
        tag,
        q,
        user_id,
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10) || 12));
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;

      let query = supabase.from('posts').select('*', { count: 'exact' }).eq('is_removed', false);

      if (type && type !== 'all') query = query.eq('type', type);
      if (subject) query = query.eq('subject', subject);
      if (education_level) query = query.eq('education_level', education_level);
      if (class_level) query = query.eq('class_level', class_level);
      if (user_id) query = query.eq('user_id', user_id);
      if (tag) query = query.contains('tags', [String(tag).toLowerCase()]);
      if (q) {
        const term = String(q).replace(/%/g, '').slice(0, 80);
        query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
      }

      if (sort === 'popular') {
        query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false });
      } else if (sort === 'trending') {
        query = query.order('comment_count', { ascending: false }).order('like_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      const { user } = await getAuthUser(req);
      const posts = await enrichPosts(data || [], user?.id);

      return res.status(200).json({
        posts,
        total: count || 0,
        page: pageNum,
        hasMore: (count || 0) > to + 1,
      });
    }

    if (req.method === 'POST') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      if (!rateLimit(`post-create:${auth.user.id}`, 15)) {
        return res.status(429).json({ error: 'Terlalu banyak postingan. Coba lagi nanti.' });
      }

      const body = req.body || {};
      const type = body.type === 'answer' ? 'answer' : 'question';
      const title = sanitizeText(body.title || '').slice(0, 160);
      const content = sanitizeText(body.content || '').slice(0, 20000);
      const subject = sanitizeText(body.subject || '').slice(0, 80);
      const education_level = sanitizeText(body.education_level || '').slice(0, 40);
      const class_level = sanitizeText(body.class_level || '').slice(0, 40);
      const tags = parseTags(body.tags);
      const images = parseImages(body.images);

      if (!title || title.length < 5) return res.status(400).json({ error: 'Judul minimal 5 karakter' });
      if (!content || content.length < 10) return res.status(400).json({ error: 'Isi minimal 10 karakter' });
      if (!subject) return res.status(400).json({ error: 'Mata pelajaran wajib dipilih' });
      if (!education_level) return res.status(400).json({ error: 'Jenjang wajib dipilih' });
      if (!class_level) return res.status(400).json({ error: 'Kelas wajib dipilih' });

      const now = new Date().toISOString();
      const row = {
        user_id: auth.user.id,
        type,
        title,
        content,
        slug: slugify(title),
        subject,
        education_level,
        class_level,
        tags,
        images,
        like_count: 0,
        comment_count: 0,
        bookmark_count: 0,
        answer_count: 0,
        view_count: 0,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase.from('posts').insert(row).select().single();
      if (error) throw error;

      await notifyMentions(
        content,
        auth.user.id,
        auth.profile.nickname || auth.profile.username,
        data.slug,
        'post',
        data.id
      );

      const [enriched] = await enrichPosts([data], auth.user.id);
      return res.status(201).json(enriched);
    }

    if (req.method === 'PUT') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const body = req.body || {};
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'id diperlukan' });

      const { data: existing } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Post tidak ditemukan' });
      if (existing.user_id !== auth.user.id && auth.profile.role !== 'owner') {
        return res.status(403).json({ error: 'Tidak diizinkan' });
      }

      const updates = { updated_at: new Date().toISOString() };
      if (body.title !== undefined) {
        const title = sanitizeText(body.title).slice(0, 160);
        if (title.length < 5) return res.status(400).json({ error: 'Judul minimal 5 karakter' });
        updates.title = title;
      }
      if (body.content !== undefined) {
        const content = sanitizeText(body.content).slice(0, 20000);
        if (content.length < 10) return res.status(400).json({ error: 'Isi minimal 10 karakter' });
        updates.content = content;
      }
      if (body.subject !== undefined) updates.subject = sanitizeText(body.subject).slice(0, 80);
      if (body.education_level !== undefined) updates.education_level = sanitizeText(body.education_level).slice(0, 40);
      if (body.class_level !== undefined) updates.class_level = sanitizeText(body.class_level).slice(0, 40);
      if (body.tags !== undefined) updates.tags = parseTags(body.tags);
      if (body.images !== undefined) updates.images = parseImages(body.images);

      const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      const [enriched] = await enrichPosts([data], auth.user.id);
      return res.status(200).json(enriched);
    }

    if (req.method === 'DELETE') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: 'id diperlukan' });

      const { data: existing } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Post tidak ditemukan' });
      if (existing.user_id !== auth.user.id && auth.profile.role !== 'owner') {
        return res.status(403).json({ error: 'Tidak diizinkan' });
      }

      // cascade-ish cleanup
      const { data: comments } = await supabase.from('comments').select('id').eq('post_id', id);
      const commentIds = (comments || []).map((c) => c.id);
      if (commentIds.length) {
        await supabase.from('comment_likes').delete().in('comment_id', commentIds);
      }
      await supabase.from('comments').delete().eq('post_id', id);

      const { data: answers } = await supabase.from('question_answers').select('id').eq('post_id', id);
      const answerIds = (answers || []).map((a) => a.id);
      if (answerIds.length) {
        await supabase.from('votes').delete().in('answer_id', answerIds);
      }
      await supabase.from('question_answers').delete().eq('post_id', id);
      await supabase.from('post_likes').delete().eq('post_id', id);
      await supabase.from('bookmarks').delete().eq('post_id', id);
      await supabase.from('posts').delete().eq('id', id);

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('posts error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
