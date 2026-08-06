import supabase from '../server/db-client.js';
import { handleOptions, cors, requireUser, rateLimit, enrichPosts } from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      const auth = await requireUser(req, res);
      if (!auth) return;

      const { data: bms } = await supabase
        .from('bookmarks')
        .select('post_id, created_at')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false });

      const ids = (bms || []).map((b) => b.post_id);
      if (!ids.length) return res.status(200).json([]);

      const { data: posts } = await supabase.from('posts').select('*').in('id', ids);
      const enriched = await enrichPosts(posts || [], auth.user.id);
      const order = new Map(ids.map((id, i) => [id, i]));
      enriched.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      if (!rateLimit(`bm:${auth.user.id}`, 60)) {
        return res.status(429).json({ error: 'Terlalu banyak permintaan' });
      }

      const post_id = Number(req.body?.post_id);
      if (!post_id) return res.status(400).json({ error: 'post_id diperlukan' });

      const { data: post } = await supabase.from('posts').select('*').eq('id', post_id).maybeSingle();
      if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });

      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', post_id)
        .eq('user_id', auth.user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('bookmarks').delete().eq('id', existing.id);
        const count = Math.max(0, (post.bookmark_count || 1) - 1);
        await supabase.from('posts').update({ bookmark_count: count }).eq('id', post_id);
        return res.status(200).json({ bookmarked: false, count });
      }

      await supabase.from('bookmarks').insert({
        post_id,
        user_id: auth.user.id,
        created_at: new Date().toISOString(),
      });
      const count = (post.bookmark_count || 0) + 1;
      await supabase.from('posts').update({ bookmark_count: count }).eq('id', post_id);
      return res.status(200).json({ bookmarked: true, count });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('bookmarks error:', err);
    return res.status(500).json({ error: err.message });
  }
}
