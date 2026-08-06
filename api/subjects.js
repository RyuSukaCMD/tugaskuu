import supabase from '../server/db-client.js';
import { handleOptions, cors } from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('subjects').select('*').order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('subjects error:', err);
    return res.status(500).json({ error: err.message });
  }
}
