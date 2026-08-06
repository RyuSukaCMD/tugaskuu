import supabase from './db-client.js';
import {
  handleOptions,
  cors,
  getAuthUser,
  requireUser,
  sanitizeText,
  rateLimit,
  usernameFromEmail,
  enrichPosts,
} from './_helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      const { id, username } = req.query;
      let query = supabase.from('profiles').select('*');
      if (id) query = query.eq('id', id);
      else if (username) query = query.eq('username', String(username).toLowerCase());
      else return res.status(400).json({ error: 'id atau username diperlukan' });

      const { data: profile, error } = await query.maybeSingle();
      if (error) throw error;
      if (!profile) return res.status(404).json({ error: 'Profil tidak ditemukan' });

      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { count: qaCount } = await supabase
        .from('question_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      const postList = posts || [];
      const totalLikes = postList.reduce((s, p) => s + (p.like_count || 0), 0);

      const { data: answers } = await supabase
        .from('question_answers')
        .select('upvote_count')
        .eq('user_id', profile.id);
      const totalUpvotes = (answers || []).reduce((s, a) => s + (a.upvote_count || 0), 0);

      const { user } = await getAuthUser(req);
      const enriched = await enrichPosts(postList, user?.id);

      return res.status(200).json({
        profile,
        stats: {
          posts: postList.length,
          questions: postList.filter((p) => p.type === 'question').length,
          answers: postList.filter((p) => p.type === 'answer').length,
          question_answers: qaCount || 0,
          total_likes: totalLikes,
          total_upvotes: totalUpvotes,
        },
        posts: enriched,
      });
    }

    if (req.method === 'POST') {
      const { user } = await getAuthUser(req);
      if (!user) return res.status(401).json({ error: 'Login diperlukan' });
      if (!rateLimit(`profile-post:${user.id}`, 20)) {
        return res.status(429).json({ error: 'Terlalu banyak permintaan' });
      }

      const existing = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (existing.data) return res.status(200).json(existing.data);

      const meta = user.user_metadata || {};
      let username = usernameFromEmail(user.email, meta.full_name || meta.name);
      const { data: clash } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      if (clash) username = `${username}${Date.now().toString(36).slice(-3)}`;

      const row = {
        id: user.id,
        email: user.email || '',
        username,
        nickname: sanitizeText(meta.full_name || meta.name || username),
        bio: '',
        avatar_url: meta.avatar_url || meta.picture || null,
        school: null,
        education_level: null,
        class_level: null,
        favorite_subjects: [],
        social_links: {},
        role: 'user',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('profiles').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      if (!rateLimit(`profile-put:${auth.user.id}`, 30)) {
        return res.status(429).json({ error: 'Terlalu banyak permintaan' });
      }

      const body = req.body || {};
      const updates = {};

      if (body.nickname !== undefined) {
        const n = sanitizeText(body.nickname).slice(0, 40);
        if (!n) return res.status(400).json({ error: 'Nickname wajib diisi' });
        updates.nickname = n;
      }
      if (body.username !== undefined) {
        const u = sanitizeText(body.username).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
        if (u.length < 3) return res.status(400).json({ error: 'Username minimal 3 karakter' });
        const { data: taken } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', u)
          .neq('id', auth.user.id)
          .maybeSingle();
        if (taken) return res.status(400).json({ error: 'Username sudah dipakai' });
        updates.username = u;
      }
      if (body.bio !== undefined) updates.bio = sanitizeText(body.bio).slice(0, 500);
      if (body.avatar_url !== undefined) updates.avatar_url = sanitizeText(body.avatar_url).slice(0, 1000) || null;
      if (body.school !== undefined) updates.school = sanitizeText(body.school).slice(0, 120) || null;
      if (body.education_level !== undefined) updates.education_level = sanitizeText(body.education_level).slice(0, 40) || null;
      if (body.class_level !== undefined) updates.class_level = sanitizeText(body.class_level).slice(0, 40) || null;
      if (body.favorite_subjects !== undefined) {
        updates.favorite_subjects = Array.isArray(body.favorite_subjects)
          ? body.favorite_subjects.map(sanitizeText).slice(0, 10)
          : [];
      }
      if (body.social_links !== undefined && typeof body.social_links === 'object') {
        updates.social_links = {
          instagram: sanitizeText(body.social_links.instagram || '').slice(0, 80),
          twitter: sanitizeText(body.social_links.twitter || '').slice(0, 80),
          github: sanitizeText(body.social_links.github || '').slice(0, 80),
          website: sanitizeText(body.social_links.website || '').slice(0, 120),
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', auth.user.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
