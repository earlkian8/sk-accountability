const { supabase } = require('../services/supabaseClient');

// POST /api/programs/:id/comments
// Body: { author, role, text }
async function addComment(req, res) {
  const { id: programId } = req.params;
  const { author, role, text } = req.body;

  if (!author || !role || !text) {
    return res.status(400).json({ error: 'author, role, and text are required' });
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ program_id: programId, author, role, text })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({
    id: data.id,
    author: data.author,
    role: data.role,
    text: data.text,
    date: data.date,
  });
}

// GET /api/programs/:id/comments
async function getComments(req, res) {
  const { id: programId } = req.params;

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('program_id', programId)
    .order('date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

module.exports = { addComment, getComments };