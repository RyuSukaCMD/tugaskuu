import supabase from '../server/db-client.js';
import { handleOptions, cors, requireUser, rateLimit } from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = await requireUser(req, res);
    if (!auth) return;
    if (!rateLimit(`upload:${auth.user.id}`, 20)) {
      return res.status(429).json({ error: 'Batas unggah tercapai' });
    }

    const { fileName, fileBase64, contentType } = req.body || {};
    if (!fileName || !fileBase64 || !contentType) {
      return res.status(400).json({ error: 'fileName, fileBase64, contentType wajib' });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(contentType)) {
      return res.status(400).json({ error: 'Tipe file tidak didukung' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Ukuran maksimal 4MB' });
    }

    const safeName = String(fileName)
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .slice(0, 80);
    const path = `${auth.user.id}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from('tugasku-images').upload(path, buffer, {
      contentType,
      upsert: false,
    });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('tugasku-images').getPublicUrl(path);
    return res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload gagal' });
  }
}
