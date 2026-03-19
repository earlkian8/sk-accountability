const multer = require('multer');
const { uploadPhoto } = require('../services/storageService');

// Use memory storage — we stream directly to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

// POST /api/upload
// multipart/form-data with field name "photo"
async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const publicUrl = await uploadPhoto(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { upload, uploadFile };