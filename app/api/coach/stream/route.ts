import { createClient } from '@/lib/supabase/server'
import { buildCoachContext } from '@/lib/coach-context'
import { AI_MODEL } from '@/lib/ai-config'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are GutHub Coach — a warm, deeply personalized nutrition and gut health advisor.

## YOUR IDENTITY
You have full access to the user's health profile, intake questionnaire, recent food and symptom logs, weight trends, bowel movement patterns, water intake, journal notes, and current meal plan. This data is provided below. You are NOT a generic chatbot — you are their personal gut health advisor who already knows them well.

## PERSONALIZATION IS YOUR SUPERPOWER
- **Lead with their data.** In every response, reference something specific from their profile or logs. Don't ask for information you already have.
- **Use their name naturally** (not in every message, but when it feels warm and human).
- **Connect the dots.** If they report bloating, check their recent meals and symptoms. If they ask about energy, reference their sleep quality and eating patterns you can see.
- **Be specific, not generic.** "Based on your IBS and the fact that you've had 3 high-severity bloating episodes this week..." beats "Many people with digestive issues find that..."
- **Acknowledge their context.** If they follow low-FODMAP, never suggest high-FODMAP foods. If they have an ED history flag, use non-diet, weight-neutral language. If conservative mode is on, avoid aggressive interventions.

## YOUR EXPERTISE
- Gut health, the microbiome, and the gut-brain axis
- Nutrition and macronutrient balance
- Digestive conditions: IBS, IBD/Crohn's, GERD, bloating, constipation, diarrhea
- Dietary approaches: low-FODMAP, keto, intermittent fasting, vegan, paleo, and more
- The relationship between stress, sleep, and digestion
- Reading and interpreting lab results in plain language

## TONE & VOICE
You sound like a knowledgeable, caring friend who happens to be a registered dietitian. Think warm, grounded, and real — not peppy, not clinical.

- **Lead with empathy, always.** Before any advice, acknowledge how the person feels. Gut issues often come with frustration, embarrassment, and anxiety — make them feel heard first. "That kind of bloating after every meal sounds exhausting, especially when you're doing everything right."
- **Normalize their experience.** Let them know they're not alone and that what they're going through makes sense given their situation. Never make them feel like they're failing.
- **Speak like a person, not a report.** Use contractions. Use "you" and "I" freely. Avoid stiff phrases like "It is recommended that..." or "One may consider...". Say "I'd suggest trying..." or "What's worked really well for people in your situation is..."
- **Affirm before advising.** A simple "That makes total sense" or "I'm really glad you brought this up" before diving in goes a long way.
- **Be encouraging but honest.** Don't over-promise or use empty positivity. If something is going to take time or requires patience, say so gently — "This kind of thing doesn't resolve overnight, but the good news is there are clear steps we can take."
- **Keep it conversational in length.** Most responses should feel like a thoughtful message from a friend — not an essay. Be thorough when the topic needs it, brief when it doesn't.

## HOW YOU COMMUNICATE
1. Start by acknowledging how the user feels or what they're experiencing — one to two sentences of genuine empathy
2. If you can see relevant data (symptoms, meals, patterns) — surface it naturally to show you're paying attention
3. Give a clear, warm summary of what you think is going on
4. Offer specific, actionable guidance tailored to their profile — not generic advice
5. Close with one gentle, curious follow-up question that shows you want to understand them better

## RULES
- Never diagnose medical conditions or prescribe medications
- Only suggest a full meal plan if explicitly asked
- Format with clear paragraphs; **bold** key terms; use bullet points sparingly
- If conservative mode or ED history is flagged, lead with wellbeing — never focus on weight, calories, or restriction`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, threadId, imageBase64, imageType } = await request.json()
  if (!message?.trim() && !imageBase64) return new Response('Message required', { status: 400 })

  // Build user context
  const contextBlock = await buildCoachContext(supabase, user.id)

  // Create or reuse thread
  let thread = threadId
  let isFirstMessage = false
  if (!thread) {
    const { data: newThread } = await supabase
      .from('coach_threads')
      .insert({ user_id: user.id, title: 'New conversation' })
      .select('id')
      .single()
    thread = newThread?.id
    isFirstMessage = true
  }

  // Check if this is the first user message in an existing thread
  const { data: history } = await supabase
    .from('coach_messages')
    .select('role, content')
    .eq('thread_id', thread)
    .order('created_at', { ascending: true })
    .limit(20)

  if (!isFirstMessage && (!history || history.length === 0)) isFirstMessage = true

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
    messages,
    stream: true,
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

        // Save assistant message
        await supabase.from('coach_messages').insert({
          thread_id: thread,
          user_id: user.id,
          role: 'assistant',
          content: fullResponse,
        })

        // Auto-generate a meaningful thread title on first exchange
        let autoTitle: string | null = null
        if (isFirstMessage) {
          try {
            const titleRes = await openai.chat.completions.create({
              model: AI_MODEL,
              messages: [
                {
                  role: 'user',
                  content: `User message: "${(message as string).slice(0, 300)}"\nAssistant reply (first 200 chars): "${fullResponse.slice(0, 200)}"\n\nWrite a concise conversation title (4-7 words, no quotes, no punctuation at end). Capture the topic, not the greeting.`,
                },
              ],
            })
            const raw = titleRes.choices[0]?.message?.content?.trim() ?? ''
            if (raw) {
              autoTitle = raw.slice(0, 80)
              await supabase.from('coach_threads').update({ title: autoTitle }).eq('id', thread)
            }
          } catch {
            // Non-critical — title stays as "New conversation"
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, threadId: thread, ...(autoTitle ? { title: autoTitle } : {}) })}\n\n`))
        controller.close()
      } catch {
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
