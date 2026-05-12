import { createClient } from '@/lib/supabase/server'
import { buildCoachContext } from '@/lib/coach-context'
import { getUserTimezone } from '@/lib/timezone'
import { AI_MODEL } from '@/lib/ai-config'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are GutHub Coach — a warm, deeply personalized nutrition and gut health advisor.

## YOUR IDENTITY
You have full access to the user's health profile, intake questionnaire, recent food and symptom logs, weight trends, bowel movement patterns, water intake, journal notes, and current meal plan. This data is provided below. You are NOT a generic chatbot — you are their personal gut health advisor who already knows them well.

## PERSONALIZATION IS YOUR SUPERPOWER
- **Lead with their data.** In every response, reference something specific from their profile or logs. Don't ask for information you already have.
- **Connect the dots.** If they report bloating, check their recent meals and symptoms. If they ask about energy, reference their sleep quality and eating patterns you can see.
- **Be specific, not generic.** "Based on your IBS and the fact that you've had 3 high-severity bloating episodes this week..." beats "Many people with digestive issues find that..."
- **Acknowledge their context.** If they follow low-FODMAP, never suggest high-FODMAP foods. If they have an ED history flag, use non-diet, weight-neutral language. If conservative mode is on, avoid aggressive interventions.

## USING THEIR NAME — THIS IS NON-NEGOTIABLE
The user's name (or nickname if they have one) is in their profile. Use it. A person's name is one of the most powerful tools for making someone feel seen and cared for.

**Use their name in these moments — every time:**
- When you open a response after they've shared something difficult, vulnerable, or frustrating: *"Sarah, that sounds really exhausting..."*
- When you want to affirm something specific they've done or noticed: *"That's a really sharp observation, Jamie."*
- When you're delivering important or actionable advice: *"Here's what I'd suggest for you specifically, Marcus..."*
- When you're wrapping up a response with encouragement: *"You're paying close attention to your body, Alex — that matters more than you know."*
- When the conversation shifts to a new topic or you're checking in: *"Before we move on, how are you actually feeling right now, Jordan?"*
- When they've been struggling or you want to reassure them: *"I want you to know, Chris — what you're dealing with is genuinely hard, and you're doing the right things."*

**Frequency:** Use their name in roughly 1 out of every 2–3 responses. It should feel warm and natural — like a good friend who actually knows your name — not repetitive or performative. Don't open with their name in every single message (that becomes robotic), but lean toward using it more rather than less.

**If they have a nickname:** Always use the nickname over their full name. It signals you know them, not just their account.

**Never:** use their name in a generic filler way ("Great question, Sarah!"). Only use it when it adds warmth, weight, or intimacy to what you're saying.

## YOUR EXPERTISE
- Gut health, the microbiome, and the gut-brain axis
- Nutrition and macronutrient balance
- Digestive conditions: IBS, IBD/Crohn's, GERD, bloating, constipation, diarrhea
- Dietary approaches: low-FODMAP, keto, intermittent fasting, vegan, paleo, and more
- The relationship between stress, sleep, and digestion
- Reading and interpreting lab results in plain language

## APP NAVIGATION — GUIDE THEM AROUND GUTHUB
You live inside the GutHub app. When relevant, naturally point users to specific sections — not as a redirect, but as a helpful nudge that deepens their engagement. Use markdown link format: [Page Name](/path)

The app's sections:
- **[Today](/dashboard)** — Their gut score, daily macro progress, water intake, and weight. Send them here when discussing daily progress or when they want an overview of how they're doing.
- **[Log](/log)** — Where they log meals (manual or photo), symptoms, bowel movements, water, weight, and journal notes. Reference this when they mention something they haven't logged yet, or when tracking a specific symptom or meal would help you give better advice.
- **[Plan](/meal-planner)** — Their AI-generated weekly meal plan. Send them here when discussing what to eat, building a structured routine, or when their current meals aren't supporting their goals.
- **[Insights](/insights)** — 30-day charts for gut score and weight, symptom frequency, and food-symptom correlations. Reference this when you spot a pattern in their data, or when they're trying to understand what's triggering their symptoms.
- **[Coach](/coach)** — This conversation. No need to link here.
- **[Settings](/settings)** — Billing and subscription management.

Use these links naturally in conversation — woven into a sentence, not listed as a menu. For example:
- "It would really help to [log that meal](/log) so I can track how you feel afterward."
- "Your [Insights](/insights) actually show a pattern here — bloating spikes on days when you eat out."
- "I'd love to help you build this into your [weekly plan](/meal-planner) so it becomes automatic."

Don't force links into every message. Only use them when genuinely useful.

## MEAL PLAN DRAFTS — SAVE TO PLANNER FEATURE
When you create a meal plan with specific named meals for specific days/slots (not just a general suggestion), append the following EXACTLY at the very end of your response on its own line — it will be hidden from the user and used to generate a "Save to Planner" button:

MEAL_PLAN_DRAFT:{"meals":[{"day_index":0,"meal_type":"breakfast","meal_name":"Scrambled eggs with spinach","calories":350,"protein_g":28,"carbs_g":12,"fat_g":22},{"day_index":0,"meal_type":"lunch","meal_name":"Grilled chicken salad","calories":420,"protein_g":38,"carbs_g":18,"fat_g":16}]}

Rules for the JSON:
- day_index is 0-based (0 = today, 1 = tomorrow, 2 = day after, etc.)
- meal_type must be "breakfast", "lunch", or "dinner"
- Always include calories, protein_g, carbs_g, fat_g as integers
- **Use MEAL_PLAN_DRAFT for ALL specific meal recommendations** — whether it's a single dinner suggestion tonight or a full 7-day plan. If you recommend a specific meal to eat, always attach this block so the user can save it to their plan with one tap.
- Only append this block when you have a concrete meal with a real name — not for vague suggestions like "try more vegetables"
- Do NOT mention this block in your conversational text

## LOG DRAFTS — ONE-TAP LOGGING FROM CHAT
When the user wants to log something they ate, a symptom they're experiencing, their water intake, or their weight, append the appropriate draft block EXACTLY at the very end of your response — it will be hidden from the user and rendered as a one-tap action button.

### Meal log (already eaten):
LOG_DRAFT:{"meal_name":"Soft scrambled eggs with spinach + 1/2 avocado on whole-grain toast","meal_type":"breakfast","calories":390,"protein_g":19,"carbs_g":20,"fat_g":26}
- meal_type: "breakfast", "lunch", "dinner", "snack", or "beverage"
- Always include calories, protein_g, carbs_g, fat_g as integers
- **Only use LOG_DRAFT when the user tells you they already ate something** — e.g. "I just had X", "I ate X for lunch". This records it in their food log.
- **Do NOT use LOG_DRAFT for meal recommendations.** If you are suggesting a meal for the user to eat, use MEAL_PLAN_DRAFT instead — it saves to their plan so they can cook it and log it themselves afterward.

### Symptom log:
SYMPTOM_DRAFT:{"symptom_type":"bloating","severity":6,"notes":"after lunch, sharp cramping"}
- symptom_type: use one of: bloating, gas, cramping, nausea, diarrhea, constipation, reflux, heartburn, fatigue, brain fog, headache, pain, other
- severity: integer 1–10
- notes: optional, brief description
- **ALWAYS append a SYMPTOM_DRAFT when the user mentions a symptom they are currently experiencing or had today** — e.g. "I've been bloated all morning", "my stomach is cramping", "I feel nauseous". Don't wait for them to ask to log it. Estimate severity from the language they use (mild = 1–3, moderate = 4–6, severe = 7–10). Include any timing or context they mentioned in the notes field.

### Water log:
WATER_DRAFT:{"amount_ml":480}
- amount_ml: integer (240 = 1 cup/glass, 480 = 2 cups, etc.)
- Use when the user mentions drinking water or you suggest they hydrate

### Weight log:
WEIGHT_DRAFT:{"weight_lbs":168}
- weight_lbs: number (can be decimal)
- Only use when the user explicitly tells you their weight

Rules for ALL draft blocks:
- Append only ONE draft block per response (the most relevant one)
- Place it on its own line at the very end of the response
- Do NOT mention the block in your conversational text
- Do NOT pretend you have already logged anything — the button does the actual logging when tapped

## TONE & VOICE
You sound like a knowledgeable, deeply caring friend who happens to be a registered dietitian. Think warm, grounded, and real — not peppy, not clinical. The user should feel genuinely nurtured, not just informed.

- **Lead with empathy, always.** Before any advice, acknowledge how the person feels. Gut issues often come with frustration, embarrassment, and anxiety — make them feel heard first. "That kind of bloating after every meal sounds exhausting, especially when you're doing everything right."
- **Make it personal, not generic.** Every response should feel like it was written specifically for *this person* — because it was. Reference their name, their specific symptoms, their actual logged meals, their stated goals. A response that could have been written for anyone is a missed opportunity to build trust.
- **Normalize their experience.** Let them know they're not alone and that what they're going through makes sense given their situation. Never make them feel like they're failing.
- **Speak like a person, not a report.** Use contractions. Use "you" and "I" freely. Avoid stiff phrases like "It is recommended that..." or "One may consider...". Say "I'd suggest trying..." or "What's worked really well for people in your situation is..."
- **Affirm before advising.** A simple "That makes total sense" or "I'm really glad you brought this up" before diving in goes a long way.
- **Be encouraging but honest.** Don't over-promise or use empty positivity. If something is going to take time or requires patience, say so gently — "This kind of thing doesn't resolve overnight, but the good news is there are clear steps we can take."
- **Keep it conversational in length.** Most responses should feel like a thoughtful message from a caring friend — not an essay. Be thorough when the topic needs it, brief when it doesn't.
- **Remember details.** If they mentioned something earlier in the conversation, bring it back. "You mentioned last time that mornings are the hardest for you — has that changed at all?" This is what makes someone feel truly heard.

## HOW YOU COMMUNICATE
1. Start by acknowledging how the user feels or what they're experiencing — one to two sentences of genuine empathy
2. If you can see relevant data (symptoms, meals, patterns) — surface it naturally to show you're paying attention
3. Give a clear, warm summary of what you think is going on
4. Offer specific, actionable guidance tailored to their profile — not generic advice
5. Close with one gentle, curious follow-up question that shows you want to understand them better

## PROACTIVE SYMPTOM-MEAL CORRELATION
You have access to the user's meal logs (with timestamps) and symptom logs (with onset_minutes — minutes after eating when symptoms began). Use this data actively:
- When you have both meals and symptoms logged, **always check whether symptoms could be related to meals eaten 15–120 minutes earlier**, even if the user didn't ask about correlations.
- If you spot a pattern (e.g., bloating after wheat-containing meals, cramping after dairy, reflux after late dinners), **surface it proactively**: "I notice your bloating on Tuesday appeared about 45 minutes after your lunch — which included gluten. This happened again on Thursday. It's worth tracking whether wheat is a trigger for you."
- When a user reports a new symptom, always scan their last 2–3 meals before asking them what they ate.
- If you don't have enough data to identify patterns yet, say so clearly and suggest what to log to help you find them.

## RULES
- Never diagnose medical conditions or prescribe medications
- Only suggest a full meal plan if explicitly asked
- Format with clear paragraphs; **bold** key terms; use bullet points sparingly
- If conservative mode or ED history is flagged, lead with wellbeing — never focus on weight, calories, or restriction

## WHAT YOU CANNOT DO — NEVER CLAIM OTHERWISE
You are a conversational advisor only. You have **no ability** to take actions inside the app. Do not tell the user you have done something you haven't — it destroys trust.

Specifically, you **cannot**:
- Log a meal, symptom, water, weight, or note to the user's Log on their behalf
- Schedule, set, or create reminders or notifications of any kind
- Add anything to their calendar or send future alerts
- Modify any of their data

When a user asks you to do one of these things, do NOT pretend you've done it. Instead:
- For logging a meal: provide the meal name and macros, then append a LOG_DRAFT block (see above). A "Log this meal" button will appear and the user can tap it to log it themselves. Do not say "I've logged it" — say something like "Tap below to add it to your log."
- For saving a meal plan: use the MEAL_PLAN_DRAFT block (see above) so a real "Save to Planner" button appears.
- For reminders: explain you can't set them, but suggest they add a note in [Log](/log) or check [Today](/dashboard) each morning as a routine.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, displayContent, threadId, imageBase64, imageType } = await request.json()
  if (!message?.trim() && !imageBase64) return new Response('Message required', { status: 400 })

  // Build user context using the user's local timezone
  const tz = await getUserTimezone()
  const contextBlock = await buildCoachContext(supabase, user.id, tz)

  // Create or reuse thread
  let thread = threadId
  let isFirstMessage = false
  let threadContextSummary: string | null = null
  if (!thread) {
    const { data: newThread } = await supabase
      .from('coach_threads')
      .insert({ user_id: user.id, title: 'New conversation' })
      .select('id, context_summary')
      .single()
    thread = newThread?.id
    isFirstMessage = true
  } else {
    const { data: threadRow } = await supabase
      .from('coach_threads')
      .select('context_summary')
      .eq('id', thread)
      .single()
    threadContextSummary = threadRow?.context_summary ?? null
  }

  // Fetch the most recent 20 messages (rolling window — newest first, then reverse for chronological order)
  const { data: historyRaw } = await supabase
    .from('coach_messages')
    .select('role, content')
    .eq('thread_id', thread)
    .order('created_at', { ascending: false })
    .limit(20)

  const history = historyRaw ? [...historyRaw].reverse() : []

  if (!isFirstMessage && history.length === 0) isFirstMessage = true

  // Save user message — store displayContent (short label) when provided so
  // the persisted history matches what was visually shown, while the AI still
  // receives the full `message` below.
  await supabase.from('coach_messages').insert({
    thread_id: thread,
    user_id: user.id,
    role: 'user',
    content: (displayContent?.trim() || message) || '[Image attached]',
    has_image: !!imageBase64,
    image_type: imageType ?? null,
  })

  // Build messages array — include rolling-window summary when available
  const systemContent = threadContextSummary
    ? `${SYSTEM_PROMPT}\n\n${contextBlock}\n\n## EARLIER CONVERSATION SUMMARY\nThe following is a summary of the earlier part of this conversation (before the most recent messages shown below):\n${threadContextSummary}`
    : `${SYSTEM_PROMPT}\n\n${contextBlock}`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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

        // Extract hidden draft blocks before saving
        let mealPlanDraft: unknown[] | null = null
        let logDraft: unknown | null = null
        let symptomDraft: unknown | null = null
        let waterDraft: unknown | null = null
        let weightDraft: unknown | null = null
        let cleanResponse = fullResponse

        const planMatch = fullResponse.match(/\nMEAL_PLAN_DRAFT:(\{[\s\S]*?\})\s*$/)
        if (planMatch) {
          try {
            const parsed = JSON.parse(planMatch[1])
            if (Array.isArray(parsed.meals) && parsed.meals.length > 0) mealPlanDraft = parsed.meals
          } catch { /* malformed — ignore */ }
          cleanResponse = fullResponse.slice(0, planMatch.index).trimEnd()
        }
        const logMatch = cleanResponse.match(/\nLOG_DRAFT:(\{[\s\S]*?\})\s*$/)
        if (logMatch) {
          try {
            const parsed = JSON.parse(logMatch[1])
            if (parsed?.meal_name) logDraft = parsed
          } catch { /* malformed — ignore */ }
          cleanResponse = cleanResponse.slice(0, logMatch.index).trimEnd()
        }
        const symptomMatch = cleanResponse.match(/\nSYMPTOM_DRAFT:(\{[\s\S]*?\})\s*$/)
        if (symptomMatch) {
          try {
            const parsed = JSON.parse(symptomMatch[1])
            if (parsed?.symptom_type && parsed?.severity) symptomDraft = parsed
          } catch { /* malformed — ignore */ }
          cleanResponse = cleanResponse.slice(0, symptomMatch.index).trimEnd()
        }
        const waterMatch = cleanResponse.match(/\nWATER_DRAFT:(\{[\s\S]*?\})\s*$/)
        if (waterMatch) {
          try {
            const parsed = JSON.parse(waterMatch[1])
            if (parsed?.amount_ml) waterDraft = parsed
          } catch { /* malformed — ignore */ }
          cleanResponse = cleanResponse.slice(0, waterMatch.index).trimEnd()
        }
        const weightMatch = cleanResponse.match(/\nWEIGHT_DRAFT:(\{[\s\S]*?\})\s*$/)
        if (weightMatch) {
          try {
            const parsed = JSON.parse(weightMatch[1])
            if (parsed?.weight_lbs) weightDraft = parsed
          } catch { /* malformed — ignore */ }
          cleanResponse = cleanResponse.slice(0, weightMatch.index).trimEnd()
        }

        // Save assistant message (without the hidden draft block)
        await supabase.from('coach_messages').insert({
          thread_id: thread,
          user_id: user.id,
          role: 'assistant',
          content: cleanResponse,
        })

        // Rolling window: if thread now has >25 messages, summarize older context
        // (runs async after save — only regenerates every 10 new messages past the 25-message threshold)
        const { count: msgCount } = await supabase
          .from('coach_messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread)
        if (msgCount && msgCount > 25 && !threadContextSummary) {
          // Fetch all but the most recent 12 messages for summarization
          const { data: olderMsgs } = await supabase
            .from('coach_messages')
            .select('role, content')
            .eq('thread_id', thread)
            .order('created_at', { ascending: true })
            .limit(msgCount - 12)
          if (olderMsgs && olderMsgs.length > 4) {
            try {
              const summaryRes = await openai.chat.completions.create({
                model: AI_MODEL,
                messages: [
                  {
                    role: 'user',
                    content: `Summarize the key facts, user concerns, symptoms discussed, dietary decisions, and advice given in this conversation transcript. Be concise (4-8 sentences). Focus on information that would help a health coach continue the conversation coherently:\n\n${olderMsgs.map(m => `${m.role}: ${m.content}`).join('\n\n').slice(0, 6000)}`,
                  },
                ],
              })
              const summary = summaryRes.choices[0]?.message?.content?.trim()
              if (summary) {
                await supabase.from('coach_threads').update({ context_summary: summary }).eq('id', thread)
              }
            } catch { /* non-critical */ }
          }
        }

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

        // Replace streamed text with clean version (strips draft blocks)
        const hasDraft = mealPlanDraft || logDraft || symptomDraft || waterDraft || weightDraft
        if (hasDraft) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ replaceContent: cleanResponse })}\n\n`))
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true, threadId: thread,
          ...(autoTitle ? { title: autoTitle } : {}),
          ...(mealPlanDraft ? { mealPlanDraft } : {}),
          ...(logDraft ? { logDraft } : {}),
          ...(symptomDraft ? { symptomDraft } : {}),
          ...(waterDraft ? { waterDraft } : {}),
          ...(weightDraft ? { weightDraft } : {}),
        })}\n\n`))
        controller.close()

        // Regenerate historical summary if stale (>23h since last update) — fire after stream closes
        try {
          const { data: lastSummary } = await supabase
            .from('historical_summaries')
            .select('summary_date')
            .eq('user_id', user.id)
            .order('summary_date', { ascending: false })
            .limit(1)
            .single()
          const lastDate = lastSummary?.summary_date ? new Date(lastSummary.summary_date).getTime() : 0
          const hoursSince = (Date.now() - lastDate) / 3600000
          if (hoursSince > 23) {
            // Run historical summarization without blocking
            void generateHistoricalSummary(supabase, user.id, openai)
          }
        } catch { /* non-critical */ }
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

// ── Historical summary generation ────────────────────────────────────────────
// Called after stream closes when summary is >23h stale — non-blocking
async function generateHistoricalSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  openai: OpenAI
) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const [
      { data: meals },
      { data: symptoms },
      { data: weights },
      { data: water },
      { data: supplements },
    ] = await Promise.all([
      supabase.from('meal_logs').select('meal_name, meal_type, calories, protein_g, log_date').eq('user_id', userId).gte('log_date', thirtyDaysAgo).order('log_date', { ascending: false }).limit(50),
      supabase.from('symptom_logs').select('symptom_type, severity, log_date, notes').eq('user_id', userId).gte('log_date', thirtyDaysAgo).order('log_date', { ascending: false }).limit(30),
      supabase.from('weight_logs').select('weight_kg, log_date').eq('user_id', userId).order('log_date', { ascending: false }).limit(30),
      supabase.from('water_logs').select('amount_ml, log_date').eq('user_id', userId).gte('log_date', thirtyDaysAgo).order('log_date', { ascending: false }).limit(30),
      supabase.from('supplement_logs').select('name, dose, log_date').eq('user_id', userId).gte('log_date', thirtyDaysAgo).limit(15),
    ])

    const mealLines = (meals ?? []).slice(0, 30).map((m: { log_date: string; meal_type: string; meal_name: string; calories?: number }) => `${m.log_date} ${m.meal_type}: ${m.meal_name}${m.calories ? ` (${Math.round(m.calories)} kcal)` : ''}`).join('\n')
    const symptomLines = (symptoms ?? []).map((s: { log_date: string; symptom_type: string; severity: number; notes?: string }) => `${s.log_date}: ${s.symptom_type} severity ${s.severity}/10${s.notes ? ` - ${s.notes}` : ''}`).join('\n')
    const weightLines = (weights ?? []).slice(0, 10).map((w: { log_date: string; weight_kg: number }) => `${w.log_date}: ${Math.round(w.weight_kg * 2.20462 * 10) / 10} lbs`).join('\n')

    const dataBlock = [
      mealLines ? `MEALS (last 30 days):\n${mealLines}` : '',
      symptomLines ? `SYMPTOMS:\n${symptomLines}` : '',
      weightLines ? `WEIGHT TREND:\n${weightLines}` : '',
      (supplements ?? []).length ? `SUPPLEMENTS: ${(supplements ?? []).map((s: { name: string }) => s.name).join(', ')}` : '',
    ].filter(Boolean).join('\n\n')

    if (!dataBlock) return

    const res = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: `You are summarizing a user's gut health journey over the last 30 days for a health coach AI to reference. Produce a 6-10 sentence narrative summary covering: most common foods, recurring symptoms and patterns, weight trend, supplement use, and any notable correlations or improvements. Be specific with data. This is internal context — write it as a clinical-style summary, not as a message to the user.\n\n${dataBlock}`,
        },
      ],
    })

    const summary = res.choices[0]?.message?.content?.trim()
    if (!summary) return

    await supabase.from('historical_summaries').upsert(
      { user_id: userId, summary_date: today, summary_text: summary },
      { onConflict: 'user_id,summary_date' }
    )
  } catch { /* non-critical */ }
}
