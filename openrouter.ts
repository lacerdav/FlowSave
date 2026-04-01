// /lib/ai/openrouter.ts
// OpenRouter integration — troque modelo mudando 1 env var, zero refactor

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

const MODELS = {
  primary:  process.env.OPENROUTER_PRIMARY_MODEL  ?? 'google/gemini-2.5-flash-lite',
  fallback: process.env.OPENROUTER_FALLBACK_MODEL ?? 'deepseek/deepseek-chat-v3-0324',
} as const

const HEADERS = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
  'HTTP-Referer':  'https://getflowsave.com',   // obrigatório pelo OpenRouter
  'X-Title':       'FlowSave',
}

export type InsightType =
  | 'monthly_summary'
  | 'lean_month_alert'
  | 'pattern_analysis'

export interface FinancialData {
  currentMonth:   number
  average:        number
  survivalBudget: number
  topClient?:     string
  projectedNext?: number
  currency?:      'USD' | 'BRL'
}

// ─── Gate de plano ────────────────────────────────────────────────────────────
// Retorna null imediatamente para free users — nenhuma chamada de rede é feita.
// O componente que chama esta função deve exibir um upsell card quando null.

export async function getFinancialInsight(
  type:     InsightType,
  data:     FinancialData,
  userPlan: 'free' | 'pro'
): Promise<string | null> {

  if (userPlan !== 'pro') return null   // gate estrito — sem exceções

  const prompt = buildPrompt(type, data)

  try {
    const result = await callModel(MODELS.primary, prompt)
    if (result) return result
    // primário falhou — tenta fallback silenciosamente
    return await callModel(MODELS.fallback, prompt)
  } catch {
    return null   // nunca quebra o app por falha de IA
  }
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildPrompt(type: InsightType, data: FinancialData): string {
  const symbol = data.currency === 'BRL' ? 'R$' : '$'
  const curr   = `${symbol}${data.currentMonth.toFixed(0)}`
  const avg    = `${symbol}${data.average.toFixed(0)}`
  const surv   = `${symbol}${data.survivalBudget.toFixed(0)}`
  const proj   = data.projectedNext
    ? `${symbol}${data.projectedNext.toFixed(0)}`
    : 'not available'

  const prompts: Record<InsightType, string> = {
    monthly_summary:
      `You are a concise financial coach for freelancers. ` +
      `Current month income: ${curr}. Historical average: ${avg}. ` +
      `In exactly 2 short sentences, give an encouraging insight about this month. ` +
      `No jargon. No bullet points. Plain text only.`,

    lean_month_alert:
      `Freelancer minimum budget: ${surv}/month. ` +
      `Next month projection: ${proj}. ` +
      `In exactly 2 sentences: warn about the risk and suggest 1 concrete action. ` +
      `Direct tone, not alarmist. Plain text only.`,

    pattern_analysis:
      `Freelancer monthly average: ${avg}. Current month: ${curr}. ` +
      `Top client: ${data.topClient ?? 'not specified'}. ` +
      `Identify 1 relevant income pattern in exactly 1 short sentence. ` +
      `Plain text only.`,
  }

  return prompts[type]
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function callModel(
  model:  string,
  prompt: string
): Promise<string | null> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method:  'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model,
      max_tokens: 120,   // 2 frases curtas — custo mínimo por chamada
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) return null

  const json = await res.json()
  return json.choices?.[0]?.message?.content?.trim() ?? null
}
