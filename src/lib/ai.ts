// On-device explanation. Tries a small local text2text model via
// @huggingface/transformers once cached; falls back to a local
// extractive summary (no network, always honest about which ran).

export type Explainer = 'local' | 'cloud' | 'extractive'

let pipePromise: Promise<unknown> | null = null

async function getPipe() {
  if (!pipePromise) {
    pipePromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers')
      // tiny summarizer, cached by the PWA after first online load
      return pipeline('summarization', 'Xenova/distilbart-cnn-6-6')
    })()
  }
  return pipePromise
}

function extractive(text: string): string {
  const sents = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
  const key = sents.slice(0, 3)
  return [
    'Key points:',
    ...key.map((s, i) => `${i + 1}. ${s}`),
    '',
    'How to attack it: restate the question in your own words, solve one step at a time, then check units and reasonableness.',
  ].join('\n')
}

export async function explain(
  text: string,
): Promise<{ out: string; by: Explainer }> {
  // Online cloud fallback only if explicitly configured + reachable.
  const key = import.meta.env.VITE_OPENAI_KEY as string | undefined
  if (key && navigator.onLine) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Explain this exam question step by step for a Grade 12 learner:\n\n${text}`,
            },
          ],
          max_tokens: 400,
        }),
      })
      if (res.ok) {
        const j = await res.json()
        const out = j.choices?.[0]?.message?.content?.trim()
        if (out) return { out, by: 'cloud' }
      }
    } catch {
      // fall through to local — bit of a hack but keeps offline honest
    }
  }
  try {
    const pipe = (await getPipe()) as (
      t: string,
      o?: Record<string, unknown>,
    ) => Promise<{ summary_text: string }[]>
    const r = await pipe(text.slice(0, 1000), { max_new_tokens: 120 })
    if (r?.[0]?.summary_text) {
      return {
        out: `${r[0].summary_text}\n\nHow to attack it: restate the question, solve one step at a time, check your answer.`,
        by: 'local',
      }
    }
  } catch {
    // model not cached yet (first run offline) — extractive it is
  }
  return { out: extractive(text), by: 'extractive' }
}

// Dead-simple card maker: splits explanation into Q/A pairs. Real enough
// for v1, labeled honestly, replaced by model-generated cards in wk2.
export function makeCards(text: string, explanation: string) {
  const lines = explanation
    .split('\n')
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter((l) => l.length > 12 && !l.startsWith('Key') && !l.startsWith('How'))
    .slice(0, 4)
  const first = text.split(/(?<=[.?])\s+/)[0] ?? text.slice(0, 80)
  const cards = lines.map((l, i) => ({
    front: i === 0 ? `What is this question asking? (${first.slice(0, 60)}…)` : `Explain point ${i + 1} in your own words`,
    back: l,
  }))
  return cards.length > 0
    ? cards
    : [{ front: 'Restate the question in your own words', back: first }]
}
