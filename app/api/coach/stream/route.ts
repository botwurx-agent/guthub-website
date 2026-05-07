import { createClient } from '@/lib/supabase/server'
import { buildCoachContext } from '@/lib/coach-context'
import { AI_MODEL, TEMP } from '@/lib/ai-config'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are GutHub, a personalized nutrition and gut health advisor.

Your areas of expertise:
- Gut health and the microbiome
- Nutrition and macronutrient balance
- Digestive issues (IBS, bloating, GERD, constipation, diarrhea)
- Dietary approaches: keto, intermittent fasting, low-FODMAP, vegan, paleo, and more
- The gut-brain connection and how stress, sleep, and mood affect digestion
- Reading lab results and explaining what they mean in plain language

How you communicate:
1. Acknowledge what the user shared
2. Make sure you understand the full picture before advising
3. Give a clear, concise summary of what you think is happening
4. Provide a detailed, actionable response
5. End with a thoughtful follow-up question to keep the conversation going

Rules:
- Never diagnose medical conditions or prescribe medications
- Only suggest a meal plan if the user explicitly asks for one
- Reference the user's profile, recent logs, and past messages — personalization is your superpower
- If the user's conservative mode flag is set, avoid aggressive dietary advice
- Keep responses warm, encouraging, and human — not clinical or robotic
- Format responses with clear paragraphs. Use **bold** for key terms. Use bullet points sparingly.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, threadId, imageBase64, imageType } = await request.json()
  if (!message?.trim() && !imageBase64) return new Response('Message required', { status: 400 })

  // Build user context
  const contextBlock = await buildCoachContext(supabase, user.id)

  // Load recent thread messages (last 20 for context window)
  let thread = threadId
  if (!thread) {
    const { data: newThread } = await supabase
      .from('coach_threads')
      .insert({ user_id: user.id, title: message.slice(0, 60) })
      .select('id')
      .single()
    thread = newThread?.id
  }

  const { data: history } = await supabase
    .from('coach_messages')
    .select('role, content')
    .eq('thread_id', thread)
    .order('created_at', { ascending: true })
    .limit(20)

  // Save user message
  await supabase.from('coach_messages').insert({
    thread_id: thread,
    user_id: user.id,
    role: 'user',
    content: message || '[Image attached]',
    has_image: !!imageBase64,
    image_type: imageType ?? null,
  })

  // Build messages array
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
    ...(history ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  // Add current user message (with optional image)
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message || 'What can you tell me about this?' },
        { type: 'image_url', image_url: { url: `data:${imageType ?? 'image/jpeg'};base64,${imageBase64}` } },
      ],
    })
  } else {
    messages.push({ role: 'user', content: message })
  }

  // Stream response
  const stream = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: TEMP.chat,
    messages,
    stream: true,
    max_tokens: 2048,
  })

  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          if (delta) {
            fullResponse += delta
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta, threadId: thread })}\n\n`))
          }
        }
        // Save assistant message after stream completes
        await supabase.from('coach_messages').insert({
          thread_id: thread,
          user_id: user.id,
          role: 'assistant',
          content: fullResponse,
        })
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, threadId: thread })}\n\n`))
        controller.close()
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted.' })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
