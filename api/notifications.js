import supabase from './db-client.js';
import { handleOptions, cors, requireUser, attachAuthors } from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      const auth = await requireUser(req, res);
      if (!auth) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const rows = data || [];
      const actorIds = [...new Set(rows.map((n) => n.actor_id).filter(Boolean))];
      let actorMap = {};
      if (actorIds.length) {
        const { data: actors } = await supabase.from('profiles').select('*').in('id', actorIds);
        actorMap = Object.fromEntries((actors || []).map((a) => [a.id, a]));
      }

      return res.status(200).json(
        rows.map((n) => ({
          ...n,
          actor: n.actor_id ? actorMap[n.actor_id] || null : null,
        }))
      );
    }

    if (req.method === 'PUT') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const ids = req.body?.ids;

      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', auth.user.id)
        .eq('is_read', false);

      if (Array.isArray(ids) && ids.length) {
        query = query.in('id', ids.map(Number));
      }

      const { error } = await query;
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('notifications error:', err);
    return res.status(500).json({ error: err.message });
  }
}
