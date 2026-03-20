const express = require('express');
const router = express.Router();

const { getPrograms, getProgramById, createProgram, deleteProgram } = require('../controllers/programController');
const { castVote } = require('../controllers/voteController');
const { addComment, getComments } = require('../controllers/commentController');
const { upload, uploadFile } = require('../controllers/uploadController');

// Barangay data is now served by PSGC Cloud (https://psgc.cloud/api)
// No local barangays table or route needed.

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