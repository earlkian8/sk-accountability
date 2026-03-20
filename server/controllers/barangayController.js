/**
 * server/controllers/barangayController.js
 */
const { supabase } = require('../services/supabaseClient')

// GET /api/barangays/:code/budget
async function getBarangayBudget(req, res) {
  const { code } = req.params
  try {
    const { data, error } = await supabase
      .from('barangay_budgets')
      .select('*')
      .eq('barangay_code', code)
      .maybeSingle()

    if (error) {
      console.error('getBarangayBudget error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      barangayCode:     code,
      barangayName:     data?.barangay_name      ?? null,
      annualBudget:     data?.annual_budget       ?? 0,
      tenPercentBudget: data?.ten_percent_budget  ?? 0,
      updatedAt:        data?.updated_at          ?? null,
    })
  } catch (err) {
    console.error('getBarangayBudget exception:', err)
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/barangays/:code/budget
async function updateBarangayBudget(req, res) {
  const { code } = req.params
  const { annualBudget, tenPercentBudget, barangayName } = req.body

  if (!annualBudget || isNaN(Number(annualBudget))) {
    return res.status(400).json({ error: 'annualBudget is required and must be a number' })
  }

  const annual = Number(annualBudget)
  const tenPct = tenPercentBudget ? Number(tenPercentBudget) : Math.round(annual * 0.10)

  try {
    const { data: existing } = await supabase
      .from('barangay_budgets')
      .select('barangay_code')
      .eq('barangay_code', code)
      .maybeSingle()

    let data, error

    if (existing) {
      ;({ data, error } = await supabase
        .from('barangay_budgets')
        .update({
          barangay_name:      barangayName ?? null,
          annual_budget:      annual,
          ten_percent_budget: tenPct,
          updated_at:         new Date().toISOString(),
        })
        .eq('barangay_code', code)
        .select()
        .single())
    } else {
      ;({ data, error } = await supabase
        .from('barangay_budgets')
        .insert({
          barangay_code:      code,
          barangay_name:      barangayName ?? null,
          annual_budget:      annual,
          ten_percent_budget: tenPct,
          updated_at:         new Date().toISOString(),
        })
        .select()
        .single())
    }

    if (error) {
      console.error('updateBarangayBudget error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      barangayCode:     data.barangay_code,
      barangayName:     data.barangay_name,
      annualBudget:     data.annual_budget,
      tenPercentBudget: data.ten_percent_budget,
      updatedAt:        data.updated_at,
    })
  } catch (err) {
    console.error('updateBarangayBudget exception:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getBarangayBudget, updateBarangayBudget }