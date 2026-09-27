// Two-tier explanation: instant extractive breakdown (<100ms, offline),
// then background upgrade to cloud or on-device model. Never a spinner
// with no answer — something real is on screen immediately.

export type Explainer = 'instant' | 'local' | 'cloud' | 'extractive'

let pipePromise: Promise<unknown> | null = null
let modelReady = false
try {
  modelReady = localStorage.getItem('gf-model') === 'ready'
} catch {
  /* private mode */
}

export function isModelReady() {
  return modelReady
}

export async function prefetchModel(
  onProgress?: (pct: number) => void,
): Promise<void> {
  pipePromise = null // fresh attempt so retries actually retry
  try {
    await getPipe(onProgress)
  } catch (e) {
    pipePromise = null
    const msg = e instanceof Error ? e.message : String(e)
    if (/fetch|network|load failed|cdn|ENOTFOUND|ERR_NAME/i.test(msg))
      throw new Error(
        'Download blocked: this network cannot reach the model CDN (school/work wifi often blocks it). Retry on home wifi, or vendor the weights into public/models (see TODO.md). Instant answers keep working meanwhile.',
      )
    throw new Error(`Download failed (${msg}). Retry online.`)
  }
  modelReady = true
  try {
    localStorage.setItem('gf-model', 'ready')
  } catch {
    /* ignore */
  }
}

const MODEL = 'Xenova/LaMini-Flan-T5-77M'
// Drop-in vendored weights: copy the model snapshot to public/models/<MODEL>
// (config.json, tokenizer files, onnx/model_quantized.onnx). Loads first,
// CDN second. Vendoring also survives school networks that block HF's CDN.
const LOCAL_BASE = '/models/'

async function loadPipe(onProgress?: (pct: number) => void) {
  const { pipeline, env } = await import('@huggingface/transformers')
  env.localModelPath = LOCAL_BASE
  const cb = (p: { progress?: number }) => {
    if (typeof p.progress === 'number') onProgress?.(Math.round(p.progress))
  }
  try {
    env.allowRemoteModels = false
    return await pipeline('text2text-generation', MODEL, {
      progress_callback: cb,
    })
  } catch {
    env.allowRemoteModels = true
    return await pipeline('text2text-generation', MODEL, {
      progress_callback: cb,
    })
  } finally {
    env.allowRemoteModels = true
  }
}

async function getPipe(onProgress?: (pct: number) => void) {
  if (!pipePromise) pipePromise = loadPipe(onProgress)
  else if (onProgress) onProgress(100)
  return pipePromise
}

export function instant(text: string): string {
  const sents = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
  const key = sents.slice(0, 3)
  return [
    'What it asks:',
    ...key.map((s, i) => `${i + 1}. ${s}`),
    '',
    'Attack plan: restate in your own words, solve one step at a time, check units and reasonableness.',
  ].join('\n')
}

async function enhanceLocal(text: string): Promise<string | null> {
  try {
    const pipe = (await getPipe()) as (
      t: string,
      o?: Record<string, unknown>,
    ) => Promise<{ generated_text: string }[]>
    const r = await pipe(
      `Explain simply for a grade 12 student: ${text.slice(0, 500)}`,
      { max_new_tokens: 150 },
    )
    const out = r?.[0]?.generated_text?.trim()
    return out && out.length > 20 ? out : null
  } catch {
    return null // model not cached / first run offline — instant stands
  }
}

async function enhanceCloud(text: string): Promise<string | null> {
  const key = import.meta.env.VITE_OPENAI_KEY as string | undefined
  if (!key || !navigator.onLine) return null
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
    if (!res.ok) return null
    const j = await res.json()
    return j.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

// Background upgrade: cloud first when configured+online, else local model.
export async function upgrade(
  text: string,
): Promise<{ out: string; by: 'local' | 'cloud' } | null> {
  const cloud = await enhanceCloud(text)
  if (cloud) return { out: cloud, by: 'cloud' }
  const local = await enhanceLocal(text)
  if (local) return { out: `${local}\n\nAttack plan: restate the question, solve one step at a time, check your answer.`, by: 'local' }
  return null
}

// Dead-simple card maker: splits explanation into Q/A pairs. Real enough
// for v1, replaced by model-generated cards next.
export function makeCards(text: string, explanation: string) {
  const lines = explanation
    .split('\n')
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(
      (l) =>
        l.length > 12 &&
        !l.startsWith('What') &&
        !l.startsWith('Key') &&
        !l.startsWith('Attack') &&
        !l.startsWith('How'),
    )
    .slice(0, 4)
  const first = text.split(/(?<=[.?])\s+/)[0] ?? text.slice(0, 80)
  const cards = lines.map((l, i) => ({
    front:
      i === 0
        ? `What is this question asking? (${first.slice(0, 60)}…)`
        : `Explain point ${i + 1} in your own words`,
    back: l,
  }))
  return cards.length > 0
    ? cards
    : [{ front: 'Restate the question in your own words', back: first }]
}
