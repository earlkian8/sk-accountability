/**
 * server/controllers/programController.js
 */
const { supabase } = require('../services/supabaseClient')

async function getPrograms(req, res) {
  const { barangayId } = req.query
  let query = supabase
    .from('programs')
    .select(`*, comments (id, author, role, text, date)`)
    .order('created_at', { ascending: false })
  if (barangayId) query = query.eq('barangay_id', barangayId)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.map(mapProgram))
}

async function getProgramById(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('programs')
    .select(`*, comments (id, author, role, text, date)`)
    .eq('id', id)
    .single()
  if (error) return res.status(404).json({ error: 'Program not found' })
  res.json(mapProgram(data))
}

async function createProgram(req, res) {
  const { name, category, budget, date, description, barangayId, barangayName, cityName, provinceName, regionName, photoUrl } = req.body
  if (!name || !category || !budget || !date || !barangayId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const { data, error } = await supabase
    .from('programs')
    .insert({
      name, category, budget: Number(budget), date, description,
      barangay_id: barangayId, barangay_name: barangayName || null,
      city_name: cityName || null, province_name: provinceName || null,
      region_name: regionName || null, photo_url: photoUrl || null,
      status: 'pending', verifications: 0, flags: 0,
    })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(mapProgram(data))
}

async function updateProgram(req, res) {
  const { id } = req.params
  const { name, category, budget, date, description, status, photoUrl, barangayName, cityName, provinceName, regionName } = req.body

  const updates = {}
  if (name        !== undefined) updates.name          = name
  if (category    !== undefined) updates.category      = category
  if (budget      !== undefined) updates.budget        = Number(budget)
  if (date        !== undefined) updates.date          = date
  if (description !== undefined) updates.description   = description
  if (status      !== undefined) updates.status        = status
  if (photoUrl    !== undefined) updates.photo_url     = photoUrl
  if (barangayName !== undefined) updates.barangay_name = barangayName
  if (cityName    !== undefined) updates.city_name     = cityName
  if (provinceName !== undefined) updates.province_name = provinceName
  if (regionName  !== undefined) updates.region_name   = regionName

  const { data, error } = await supabase
    .from('programs')
    .update(updates)
    .eq('id', id)
    .select(`*, comments (id, author, role, text, date)`)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(mapProgram(data))
}

async function deleteProgram(req, res) {
  const { id } = req.params
  const { error } = await supabase.from('programs').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}

function mapProgram(p) {
  return {
    id: p.id, name: p.name, category: p.category, budget: p.budget,
    date: p.date, description: p.description, status: p.status,
    verifications: p.verifications, flags: p.flags,
    barangayId: p.barangay_id, barangayName: p.barangay_name,
    cityName: p.city_name, provinceName: p.province_name, regionName: p.region_name,
    photoUrl: p.photo_url,
    comments: (p.comments || []).map(c => ({
      id: c.id, author: c.author, role: c.role, text: c.text, date: c.date,
    })),
  }
}

module.exports = { getPrograms, getProgramById, createProgram, updateProgram, deleteProgram }