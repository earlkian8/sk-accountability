/**
 * server/routes/api.js
 */
const express = require('express')
const router  = express.Router()

const { getPrograms, getProgramById, createProgram, updateProgram, deleteProgram } = require('../controllers/programController')
const { castVote }                       = require('../controllers/voteController')
const { addComment, getComments }        = require('../controllers/commentController')
const { upload, uploadFile }             = require('../controllers/uploadController')
const { getBarangayBudget, updateBarangayBudget } = require('../controllers/barangayController')

// Barangay data → PSGC Cloud (https://psgc.cloud/api), no local list needed
// Budget data stored locally per PSGC barangay code
router.get('/barangays/:code/budget',   getBarangayBudget)
router.patch('/barangays/:code/budget', updateBarangayBudget)

// Programs
router.get('/programs',       getPrograms)
router.get('/programs/:id',   getProgramById)
router.post('/programs',      createProgram)
router.patch('/programs/:id', updateProgram)
router.delete('/programs/:id', deleteProgram)

// Votes
router.post('/programs/:id/vote', castVote)

// Comments
router.get('/programs/:id/comments',  getComments)
router.post('/programs/:id/comments', addComment)

// Photo upload
router.post('/upload', upload.single('photo'), uploadFile)

module.exports = router