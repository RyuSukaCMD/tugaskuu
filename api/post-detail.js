import supabase from './db-client.js';
import { handleOptions, cors, getAuthUser, enrichPosts } from './_helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { slug, id } = req.query;
    if (!slug && !id) return res.status(400).json({ error: 'slug atau id diperlukan' });

    let query = supabase.from('posts').select('*');
    if (id) query = query.eq('id', Number(id));
    else query = query.eq('slug', slug);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Post tidak ditemukan' });

    await supabase
      .from('posts')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    const { user } = await getAuthUser(req);
    const [enriched] = await enrichPosts([{ ...data, view_count: (data.view_count || 0) + 1 }], user?.id);
    return res.status(200).json(enriched);
  } catch (err) {
    console.error('post-detail error:', err);
    return res.status(500).json({ error: err.message });
  }
}
