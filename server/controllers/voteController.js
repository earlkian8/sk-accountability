const { supabase } = require('../services/supabaseClient');

// POST /api/programs/:id/vote
// Body: { voterId, voteType: 'verify' | 'flag' }
async function castVote(req, res) {
  const { id: programId } = req.params;
  const { voterId, voteType } = req.body;

  if (!voterId || !voteType) {
    return res.status(400).json({ error: 'voterId and voteType are required' });
  }
  if (!['verify', 'flag'].includes(voteType)) {
    return res.status(400).json({ error: 'voteType must be verify or flag' });
  }

  // Check for existing vote
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('program_id', programId)
    .eq('voter_id', voterId)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'You have already voted on this program' });
  }

  // Insert vote
  const { error: voteError } = await supabase.from('votes').insert({
    program_id: programId,
    voter_id: voterId,
    vote_type: voteType,
  });

  if (voteError) return res.status(500).json({ error: voteError.message });

  // Increment the correct counter on programs
  const field = voteType === 'verify' ? 'verifications' : 'flags';

  const { data: program, error: fetchError } = await supabase
    .from('programs')
    .select(`${field}`)
    .eq('id', programId)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  const newCount = (program[field] || 0) + 1;

  // Auto-status logic (mirrors frontend thresholds)
  let statusUpdate = {};
  if (voteType === 'verify' && newCount >= 3) {
    statusUpdate = { status: 'verified' };
  } else if (voteType === 'flag' && newCount >= 2) {
    statusUpdate = { status: 'flagged' };
  }

  const { data: updated, error: updateError } = await supabase
    .from('programs')
    .update({ [field]: newCount, ...statusUpdate })
    .eq('id', programId)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({
    verifications: updated.verifications,
    flags: updated.flags,
    status: updated.status,
  });
}

module.exports = { castVote };