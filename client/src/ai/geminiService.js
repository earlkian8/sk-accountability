/**
 * src/ai/geminiService.js
 * Gemini 2.5 Flash integration for SKCheck
 * - Public: Transparency chatbot with full barangay context
 * - KK Member: Program credibility scorecard
 */

import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-2.5-flash'

function getClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set in your .env file.')
  return new GoogleGenAI({ apiKey })
}

// ─────────────────────────────────────────────────────────────
// Build system context from barangay + programs data
// ─────────────────────────────────────────────────────────────
function buildBarangayContext(barangay, programs) {
  if (!barangay || !programs?.length) {
    return 'No barangay or program data is currently loaded.'
  }

  const totalBudget = programs.reduce((s, p) => s + Number(p.budget), 0)
  const verified    = programs.filter(p => p.status === 'verified')
  const flagged     = programs.filter(p => p.status === 'flagged')
  const pending     = programs.filter(p => p.status === 'pending')

  const programList = programs.map(p => `
  - Program: "${p.name}"
    Category: ${p.category}
    Budget: ₱${Number(p.budget).toLocaleString()}
    Date: ${p.date}
    Status: ${p.status} (${p.verifications} verifications, ${p.flags} flags)
    Description: ${p.description || 'No description provided.'}
    Photo: ${p.photoUrl ? 'Has photo evidence' : 'No photo attached'}
    Location: Brgy. ${p.barangayName || barangay.name}, ${p.cityName || ''}, ${p.provinceName || ''}
  `).join('\n')

  return `
You are SKCheck AI, a transparency assistant for the Sangguniang Kabataan (SK) accountability platform in the Philippines.

Current Barangay Context:
  Barangay: ${p => p} ${barangay.name}
  Total Programs Loaded: ${programs.length}
  Total Reported Budget: ₱${totalBudget.toLocaleString()}
  Verified Programs: ${verified.length}
  Flagged Programs: ${flagged.length}
  Pending Programs: ${pending.length}

Programs:
${programList}

Your role:
- Answer questions about the programs in this barangay honestly and clearly
- Help citizens understand how their SK funds are being used
- Explain what each program is, its cost, status, and community reception
- If asked about something not in the data, say so honestly
- Be helpful, neutral, and factual
- Respond in Filipino (Tagalog) or English depending on how the user writes
- Keep answers concise but complete
- Never make up program data that isn't provided above
`
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: Streaming chat with barangay context
// Calls onChunk(text) for each streamed token
// ─────────────────────────────────────────────────────────────
export async function streamChat({ history, userMessage, barangay, programs, onChunk, onDone, onError }) {
  try {
    const ai = getClient()
    const systemContext = buildBarangayContext(barangay, programs)

    // Build conversation contents: system context as first user turn + model ack + history + new message
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemContext }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am SKCheck AI, ready to answer questions about this barangay\'s programs.' }],
      },
      ...history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ]

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents,
    })

    let fullText = ''
    for await (const chunk of stream) {
      const chunkText = chunk.text || ''
      fullText += chunkText
      onChunk(chunkText)
    }

    onDone(fullText)
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Unknown error from Gemini')
  }
}

// ─────────────────────────────────────────────────────────────
// KK MEMBER: Credibility scorecard for a single program
// Returns structured analysis object
// ─────────────────────────────────────────────────────────────
export async function analyzeCredibility({ program, allPrograms, onChunk, onDone, onError }) {
  try {
    const ai = getClient()

    const comments = (program.comments || [])
      .map(c => `  [${c.role}] ${c.author}: "${c.text}"`)
      .join('\n') || '  No comments yet.'

    const budgetRatio = allPrograms?.length
      ? (Number(program.budget) / (allPrograms.reduce((s, p) => s + Number(p.budget), 0) / allPrograms.length)).toFixed(2)
      : 'N/A'

    const prompt = `You are an SK program auditor AI assisting a Katipunan ng Kabataan (KK) member in the Philippines.

Analyze the credibility of this SK barangay program and return a JSON object only (no markdown, no explanations):

Program Details:
  Name: ${program.name}
  Category: ${program.category}
  Budget: ₱${Number(program.budget).toLocaleString()}
  Date: ${program.date}
  Status: ${program.status}
  Verifications: ${program.verifications}
  Flags: ${program.flags}
  Description: ${program.description || 'None'}
  Has Photo Evidence: ${program.photoUrl ? 'Yes' : 'No'}
  Budget vs Barangay Average Ratio: ${budgetRatio}x

Community Comments (${program.comments?.length || 0} total):
${comments}

Return ONLY this JSON structure:
{
  "score": <number 0-100>,
  "verdict": "<one of: Highly Credible | Credible | Questionable | Suspicious>",
  "verdict_color": "<one of: green | yellow | orange | red>",
  "summary": "<2-3 sentence plain-language summary of your assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "recommendation": "<one actionable sentence for the KK member>",
  "community_sentiment": "<Positive | Mixed | Negative | No Data>"
}

Scoring rubric:
- Photo evidence: +15 points
- 3+ verifications: +20 points, 1-2: +10 points
- 0 flags: +15 points, 1 flag: +5 points, 2+ flags: -20 points
- Detailed description (100+ chars): +15 points
- Community comments present: +10 points
- Positive comment sentiment: +10 points
- Recent date (within 1 year): +10 points
- Budget seems reasonable for category: +5 points
Start with a base of 0 and add/subtract.`

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    let fullText = ''
    for await (const chunk of stream) {
      const chunkText = chunk.text || ''
      fullText += chunkText
      onChunk?.(chunkText)
    }

    // Parse JSON from response
    const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                      fullText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in AI response')

    const result = JSON.parse(jsonMatch[1] || jsonMatch[0])
    onDone(result)
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Unknown error from Gemini')
  }
}