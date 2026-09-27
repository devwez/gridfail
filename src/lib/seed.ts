import { db, type Paper } from './db'

// Small honest seed: real CAPS-style practice prompts, written for this app,
// not scraped papers. Keeps first-run useful fully offline.
export const SEED_PAPERS: (Paper & { text: string })[] = [
  {
    id: 'seed-maths-2023',
    subject: 'Maths',
    title: 'Maths practice set — algebra + trig',
    year: 2023,
    source: 'seed',
    text: 'Solve for x: 2x^2 - 5x - 3 = 0. Show factorisation steps. Then find sin(30°) + cos(60°) without a calculator.',
  },
  {
    id: 'seed-physics-2023',
    subject: 'Physics',
    title: 'Physics practice — circuits + motion',
    year: 2023,
    source: 'seed',
    text: 'A 12V battery drives 2A through a resistor. Calculate resistance and power dissipated. A car accelerates from rest at 2 m/s^2 for 5s — find final velocity and distance.',
  },
  {
    id: 'seed-english-2022',
    subject: 'English',
    title: 'English practice — comprehension + essay plan',
    year: 2022,
    source: 'seed',
    text: 'Summarise the passage in 3 sentences. Then plan a 5-paragraph essay: does social media harm attention spans? Give 3 arguments with one counter-argument.',
  },
]

export async function ensureSeed() {
  const count = await db.papers.count()
  if (count > 0) return
  for (const s of SEED_PAPERS) {
    await db.papers.add({
      id: s.id,
      subject: s.subject,
      title: s.title,
      year: s.year,
      source: s.source,
    })
    await db.pages.add({
      id: `${s.id}-p1`,
      paperId: s.id,
      text: s.text,
      createdAt: Date.now(),
    })
  }
}
