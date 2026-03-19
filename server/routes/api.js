const express = require('express');
const router = express.Router();

const { getPrograms, getProgramById, createProgram, deleteProgram } = require('../controllers/programController');
const { castVote } = require('../controllers/voteController');
const { addComment, getComments } = require('../controllers/commentController');
const { upload, uploadFile } = require('../controllers/uploadController');

// --- Barangays ---
const { supabase } = require('../services/supabaseClient');
router.get('/barangays', async (req, res) => {
  const { data, error } = await supabase
    .from('barangays')
    .select('*')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  const mapped = data.map(b => ({
    id: b.id,
    name: b.name,
    isDormant: b.is_dormant,
    annualBudget: b.annual_budget,
  }));
  res.json(mapped);
});

// --- Programs ---
router.get('/programs', getPrograms);
router.get('/programs/:id', getProgramById);
router.post('/programs', createProgram);
router.delete('/programs/:id', deleteProgram);

// --- Votes ---
router.post('/programs/:id/vote', castVote);

// --- Comments ---
router.get('/programs/:id/comments', getComments);
router.post('/programs/:id/comments', addComment);

// --- Photo Upload ---
router.post('/upload', upload.single('photo'), uploadFile);

module.exports = router;