import supabase from '../server/db-client.js';
import {
  handleOptions,
  cors,
  getAuthUser,
  requireUser,
  requireOwner,
  sanitizeText,
  rateLimit,
  usernameFromEmail,
  enrichPosts,
} from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.query.resource === 'moderation' && req.method === 'GET') {
      const auth = await requireOwner(req, res);
      if (!auth) return;
      const [{ data: reports, error }, { data: reportPosts }, { data: reportUsers }, usersCount, postsCount, openCount, removedCount] = await Promise.all([
        supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('posts').select('id, title, slug, user_id, is_removed'),
        supabase.from('profiles').select('id, nickname, username'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_removed', false),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_removed', true),
      ]);
      if (error) throw error;
      const postMap = new Map((reportPosts || []).map((post) => [post.id, post]));
      const userMap = new Map((reportUsers || []).map((user) => [user.id, user]));
      return res.status(200).json({
        stats: { users: usersCount.count || 0, posts: postsCount.count || 0, reports: (reports || []).length, openReports: openCount.count || 0, removedPosts: removedCount.count || 0 },
        reports: (reports || []).map((report) => ({ ...report, post: postMap.get(report.post_id) || null, reporter: userMap.get(report.user_id) || null })),
      });
    }

    if (req.query.resource === 'moderation' && req.method === 'PATCH') {
      const auth = await requireOwner(req, res);
      if (!auth) return;
      const id = Number(req.body?.id);
      const action = req.body?.action;
      if (!id || !['takedown', 'dismiss'].includes(action)) return res.status(400).json({ error: 'Aksi tidak valid' });
      const { data: report } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
      if (!report) return res.status(404).json({ error: 'Report tidak ditemukan' });
      if (action === 'takedown') await supabase.from('posts').update({ is_removed: true }).eq('id', report.post_id);
      const { error } = await supabase.from('reports').update({ status: action === 'takedown' ? 'actioned' : 'dismissed', reviewed_by: auth.user.id, reviewed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (req.query.resource === 'report' && req.method === 'POST') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      if (!rateLimit(`report:${auth.user.id}`, 10, 3600000)) return res.status(429).json({ error: 'Terlalu banyak laporan. Coba lagi nanti.' });
      const postId = Number(req.body?.post_id);
      const reason = ['spam', 'harassment', 'misinformation', 'copyright', 'other'].includes(req.body?.reason) ? req.body.reason : 'other';
      const details = sanitizeText(req.body?.details || '').slice(0, 1000) || null;
      const { data: post } = await supabase.from('posts').select('id, user_id, is_removed').eq('id', postId).maybeSingle();
      if (!post || post.is_removed) return res.status(404).json({ error: 'Postingan tidak ditemukan' });
      if (post.user_id === auth.user.id) return res.status(400).json({ error: 'Kamu tidak dapat melaporkan postingan sendiri' });
      const { data, error } = await supabase.from('reports').insert({ post_id: postId, user_id: auth.user.id, reason, details }).select().single();
      if (error?.code === '23505') return res.status(400).json({ error: 'Kamu sudah melaporkan postingan ini' });
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.query.resource === 'feedback' && req.method === 'GET') {
      const auth = await requireOwner(req, res);
      if (!auth) return;
      const { data, error } = await supabase
        .from('feedback')
        .select('id, user_id, category, message, created_at, user:profiles!feedback_user_id_fkey(nickname, username, email)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.query.resource === 'feedback' && req.method === 'POST') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      if (!rateLimit(`feedback:${auth.user.id}`, 8, 3600000)) {
        return res.status(429).json({ error: 'Terlalu banyak masukan. Coba lagi nanti.' });
      }
      const category = ['bug', 'idea', 'other'].includes(req.body?.category) ? req.body.category : 'other';
      const message = sanitizeText(req.body?.message || '').slice(0, 1200);
      if (message.length < 10) return res.status(400).json({ error: 'Masukan minimal 10 karakter' });
      const { data, error } = await supabase
        .from('feedback')
        .insert({ user_id: auth.user.id, category, message })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

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
