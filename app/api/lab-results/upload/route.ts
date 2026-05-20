import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { AI_MODEL_VISION } from '@/lib/ai-config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

  const service = await createServiceClient()
  const results = []

  for (const file of files) {
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const { error: upErr } = await service.storage.from('lab-reports').upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
    })
    if (upErr) {
      console.error('[lab-results/upload] storage error:', upErr)
      results.push({ filename: file.name, error: 'Upload failed' })
      continue
    }

    // Analyze with OpenAI Vision
    let analysisSummary: string | null = null
    try {
      const base64 = Buffer.from(bytes).toString('base64')
      const isImage = file.type.startsWith('image/')
      const mimeType = isImage ? file.type : 'application/pdf'

      const completion = await openai.chat.completions.create({
        model: AI_MODEL_VISION,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `You are analyzing a medical lab report for a gut health app. Extract and summarize the key findings relevant to gut health, digestion, nutrition, and overall wellness.

Focus on:
- Abnormal values (high/low markers)
- Gut microbiome findings if present
- Food sensitivities or intolerances detected
- Inflammatory markers (CRP, calprotectin, etc.)
- Nutrient deficiencies (B12, D, iron, zinc, etc.)
- Thyroid markers if present
- Blood sugar / metabolic markers
- Any conditions identified

Format your response as a clear, plain-text summary (2-4 paragraphs). Be specific with values where visible. Note which markers are outside normal range. End with a brief "Key takeaways for diet & gut health" section.

If this does not appear to be a medical lab report, describe what the document contains.`,
            },
          ],
        }],
      })

      analysisSummary = completion.choices[0].message.content ?? null
    } catch (e) {
      console.error('[lab-results/upload] OpenAI error:', e)
    }

    // Insert into lab_reports
    const { data: record, error: insertErr } = await service.from('lab_reports').insert({
      user_id: user.id,
      filename: file.name,
      storage_path: path,
      report_date: new Date().toISOString().split('T')[0],
      analysis_summary: analysisSummary,
    }).select().single()

    if (insertErr) {
      console.error('[lab-results/upload] insert error:', insertErr)
      results.push({ filename: file.name, error: 'Save failed' })
    } else {
      results.push({ filename: file.name, record })
    }
  }

  return NextResponse.json({ results })
}
