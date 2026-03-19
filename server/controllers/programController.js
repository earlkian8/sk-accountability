const { supabase } = require('../services/supabaseClient');

// GET /api/programs?barangayId=brgy-1
async function getPrograms(req, res) {
  const { barangayId } = req.query;

  let query = supabase
    .from('programs')
    .select(`
      *,
      comments (id, author, role, text, date)
    `)
    .order('created_at', { ascending: false });

  if (barangayId) {
    query = query.eq('barangay_id', barangayId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Map to camelCase for frontend compatibility
  const mapped = data.map(mapProgram);
  res.json(mapped);
}

// GET /api/programs/:id
async function getProgramById(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('programs')
    .select(`*, comments (id, author, role, text, date)`)
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Program not found' });
  res.json(mapProgram(data));
}

// POST /api/programs
async function createProgram(req, res) {
  const { name, category, budget, date, description, barangayId, photoUrl } = req.body;

  if (!name || !category || !budget || !date || !barangayId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('programs')
    .insert({
      name,
      category,
      budget: Number(budget),
      date,
      description,
      barangay_id: barangayId,
      photo_url: photoUrl || null,
      status: 'pending',
      verifications: 0,
      flags: 0,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(mapProgram(data));
}

// DELETE /api/programs/:id
async function deleteProgram(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// Helper: maps DB snake_case to frontend camelCase
function mapProgram(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    budget: p.budget,
    date: p.date,
    description: p.description,
    status: p.status,
    verifications: p.verifications,
    flags: p.flags,
    barangayId: p.barangay_id,
    photoUrl: p.photo_url,
    comments: (p.comments || []).map(c => ({
      id: c.id,
      author: c.author,
      role: c.role,
      text: c.text,
      date: c.date,
    })),
  };
}

module.exports = { getPrograms, getProgramById, createProgram, deleteProgram };