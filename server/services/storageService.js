const { supabaseAdmin } = require('./supabaseClient');
require('dotenv').config();

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

async function uploadPhoto(fileBuffer, fileName, mimeType) {
  const path = `programs/${Date.now()}-${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

module.exports = { uploadPhoto };