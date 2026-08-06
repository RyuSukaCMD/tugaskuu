import supabase from './db-client.js';
import { handleOptions, cors, requireOwner } from './_helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      const auth = await requireOwner(req, res);
      if (!auth) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'PUT') {
      const auth = await requireOwner(req, res);
      if (!auth) return;
      const id = req.body?.id;
      const role = req.body?.role;
      if (!id || !['user', 'owner'].includes(role)) {
        return res.status(400).json({ error: 'Parameter tidak valid' });
      }
      if (id === auth.user.id && role !== 'owner') {
        return res.status(400).json({ error: 'Tidak bisa menurunkan role sendiri' });
      }
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const auth = await requireOwner(req, res);
      if (!auth) return;
      const id = req.body?.id;
      if (!id) return res.status(400).json({ error: 'id diperlukan' });
      if (id === auth.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });

      // soft-manage: wipe user content references lightly by deleting profile
      await supabase.from('profiles').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('users error:', err);
    return res.status(500).json({ error: err.message });
  }
}
