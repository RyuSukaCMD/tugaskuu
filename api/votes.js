import supabase from './db-client.js';
import { handleOptions, cors, requireUser, rateLimit } from '../server/helpers.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  cors(res);

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = await requireUser(req, res);
    if (!auth) return;
    if (!rateLimit(`vote:${auth.user.id}`, 80)) {
      return res.status(429).json({ error: 'Terlalu banyak permintaan' });
    }

    const answer_id = Number(req.body?.answer_id);
    const value = Number(req.body?.value);
    if (!answer_id || ![1, -1].includes(value)) {
      return res.status(400).json({ error: 'Parameter tidak valid' });
    }

    const { data: answer } = await supabase.from('question_answers').select('*').eq('id', answer_id).maybeSingle();
    if (!answer) return res.status(404).json({ error: 'Jawaban tidak ditemukan' });

    const { data: existing } = await supabase
      .from('votes')
      .select('*')
      .eq('answer_id', answer_id)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    let upvote = answer.upvote_count || 0;
    let downvote = answer.downvote_count || 0;
    let user_vote = value;

    if (!existing) {
      await supabase.from('votes').insert({
        answer_id,
        user_id: auth.user.id,
        value,
        created_at: new Date().toISOString(),
      });
      if (value === 1) upvote += 1;
      else downvote += 1;
    } else if (existing.value === value) {
      await supabase.from('votes').delete().eq('id', existing.id);
      if (value === 1) upvote = Math.max(0, upvote - 1);
      else downvote = Math.max(0, downvote - 1);
      user_vote = null;
    } else {
      await supabase.from('votes').update({ value }).eq('id', existing.id);
      if (value === 1) {
        upvote += 1;
        downvote = Math.max(0, downvote - 1);
      } else {
        downvote += 1;
        upvote = Math.max(0, upvote - 1);
      }
    }

    await supabase
      .from('question_answers')
      .update({ upvote_count: upvote, downvote_count: downvote })
      .eq('id', answer_id);

    return res.status(200).json({ user_vote, upvote_count: upvote, downvote_count: downvote });
  } catch (err) {
    console.error('votes error:', err);
    return res.status(500).json({ error: err.message });
  }
}
