import supabase from './db-client.js';
import {
  handleOptions,
  cors,
  requireUser,
  rateLimit,
  createNotification,
} from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = await requireUser(req, res);
    if (!auth) return;
    if (!rateLimit(`like:${auth.user.id}`, 80)) {
      return res.status(429).json({ error: 'Terlalu banyak permintaan' });
    }

    const type = req.body?.type;
    const id = Number(req.body?.id);
    if (!id || !['post', 'comment'].includes(type)) {
      return res.status(400).json({ error: 'type dan id tidak valid' });
    }

    if (type === 'post') {
      const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
      if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });

      const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', auth.user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('post_likes').delete().eq('id', existing.id);
        const count = Math.max(0, (post.like_count || 1) - 1);
        await supabase.from('posts').update({ like_count: count }).eq('id', id);
        return res.status(200).json({ liked: false, count });
      }

      await supabase.from('post_likes').insert({
        post_id: id,
        user_id: auth.user.id,
        created_at: new Date().toISOString(),
      });
      const count = (post.like_count || 0) + 1;
      await supabase.from('posts').update({ like_count: count }).eq('id', id);
      await createNotification({
        userId: post.user_id,
        actorId: auth.user.id,
        type: 'like',
        entityType: 'post',
        entityId: id,
        postSlug: post.slug,
        message: `${auth.profile.nickname || auth.profile.username} menyukai postinganmu`,
      });
      return res.status(200).json({ liked: true, count });
    }

    const { data: comment } = await supabase.from('comments').select('*').eq('id', id).maybeSingle();
    if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });

    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('comment_likes').delete().eq('id', existing.id);
      const count = Math.max(0, (comment.like_count || 1) - 1);
      await supabase.from('comments').update({ like_count: count }).eq('id', id);
      return res.status(200).json({ liked: false, count });
    }

    await supabase.from('comment_likes').insert({
      comment_id: id,
      user_id: auth.user.id,
      created_at: new Date().toISOString(),
    });
    const count = (comment.like_count || 0) + 1;
    await supabase.from('comments').update({ like_count: count }).eq('id', id);

    const { data: post } = await supabase.from('posts').select('slug').eq('id', comment.post_id).maybeSingle();
    await createNotification({
      userId: comment.user_id,
      actorId: auth.user.id,
      type: 'like',
      entityType: 'comment',
      entityId: id,
      postSlug: post?.slug || null,
      message: `${auth.profile.nickname || auth.profile.username} menyukai komentarmu`,
    });

    return res.status(200).json({ liked: true, count });
  } catch (err) {
    console.error('likes error:', err);
    return res.status(500).json({ error: err.message });
  }
}
