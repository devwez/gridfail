import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { explain, makeCards } from './lib/ai'
import { db, uid, type Card, type Page, type Paper } from './lib/db'
import { ocrImage } from './lib/ocr'
import { ensureSeed } from './lib/seed'

type Tab = 'library' | 'capture' | 'study'

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const f = () => setOnline(navigator.onLine)
    window.addEventListener('online', f)
    window.addEventListener('offline', f)
    return () => {
      window.removeEventListener('online', f)
      window.removeEventListener('offline', f)
    }
  }, [])
  return online
}

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22 },
}

export default function App() {
  const online = useOnline()
  const [tab, setTab] = useState<Tab>('library')
  const [papers, setPapers] = useState<Paper[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [openPaper, setOpenPaper] = useState<string | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [attempts, setAttempts] = useState<{ correct: boolean }[]>([])

  const refresh = useCallback(async () => {
    await ensureSeed()
    setPapers(await db.papers.toArray())
    setPages(await db.pages.toArray())
    setCards(await db.cards.toArray())
    setAttempts(
      (await db.attempts.toArray()).map((a) => ({ correct: a.correct })),
    )
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const ok = attempts.filter((a) => a.correct).length

  return (
    <>
      <header className="top">
        <div>
          <div className="brand">
            Grid<span>Fail</span>
          </div>
          <div className="tagline">study when the grid fails</div>
        </div>
        <div className={`net-pill ${online ? 'on' : 'off'}`}>
          {online ? '● ONLINE' : '○ OFFLINE — fully working'}
        </div>
      </header>

      <section className="stats">
        <Stat n={papers.length} label="papers" />
        <Stat n={pages.length} label="pages" />
        <Stat n={cards.length} label="cards" />
        <Stat
          n={attempts.length ? `${Math.round((ok / attempts.length) * 100)}%` : '—'}
          label="accuracy"
        />
      </section>

      <nav className="tabs">
        {(['library', 'capture', 'study'] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
            {t === 'study' && cards.length > 0 && (
              <span className="count">{cards.length}</span>
            )}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div key={tab} {...fade}>
          {tab === 'library' && (
            <Library
              papers={papers}
              pages={pages}
              openPaper={openPaper}
              setOpenPaper={setOpenPaper}
              goStudy={() => setTab('study')}
              refresh={refresh}
            />
          )}
          {tab === 'capture' && (
            <Capture refresh={refresh} goLibrary={() => setTab('library')} />
          )}
          {tab === 'study' && <Study cards={cards} refresh={refresh} />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="stat">
      <div className="stat-n">{n}</div>
      <div className="stat-l">{label}</div>
    </div>
  )
}

function Library({
  papers,
  pages,
  openPaper,
  setOpenPaper,
  goStudy,
  refresh,
}: {
  papers: Paper[]
  pages: Page[]
  openPaper: string | null
  setOpenPaper: (id: string | null) => void
  goStudy: () => void
  refresh: () => Promise<void>
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('All')
  const subjects = ['All', ...new Set(papers.map((p) => p.subject))]

  async function runExplain(page: Page) {
    setBusy(page.id)
    setErr(null)
    try {
      const { out, by } = await explain(page.text)
      await db.pages.update(page.id, {
        explanation: out,
        explainer: by === 'cloud' ? 'cloud' : 'local',
      })
      await db.cards.where('pageId').equals(page.id).delete()
      const made = makeCards(page.text, out)
      await db.cards.bulkAdd(
        made.map((c) => ({ id: uid(), pageId: page.id, ...c })),
      )
      await refresh()
      goStudy()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Explain failed.')
    } finally {
      setBusy(null)
    }
  }

  async function exportAll() {
    const data = {
      papers,
      pages: await db.pages.toArray(),
      cards: await db.cards.toArray(),
      attempts: await db.attempts.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'gridfail-export.json'
    a.click()
  }

  const shown =
    filter === 'All' ? papers : papers.filter((p) => p.subject === filter)

  if (papers.length === 0)
    return (
      <div className="card empty">
        <h3>No papers yet</h3>
        <p>Hit Capture, snap a past paper, it lands here.</p>
      </div>
    )

  return (
    <div>
      <div className="chips">
        {subjects.map((s) => (
          <button
            key={s}
            className={filter === s ? 'active' : ''}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {shown.map((p) => (
        <div className="card" key={p.id}>
          <h3>{p.title}</h3>
          <p>
            <span className="pill">{p.subject}</span>
            <span className="pill">{p.year}</span>
            <span className="pill">{p.source}</span>
            <span className="pill">
              {pages.filter((pg) => pg.paperId === p.id).length} pages
            </span>
          </p>
          <div className="row">
            <button
              className="btn ghost"
              onClick={() => setOpenPaper(openPaper === p.id ? null : p.id)}
            >
              {openPaper === p.id ? 'Hide' : 'Open'}
            </button>
          </div>
          {openPaper === p.id &&
            pages
              .filter((pg) => pg.paperId === p.id)
              .map((pg) => (
                <div className="card sub" key={pg.id}>
                  <p className="body">{pg.text}</p>
                  {pg.explanation && (
                    <p className="explain">
                      <span
                        className={`pill ${pg.explainer === 'cloud' ? 'cloud' : 'local'}`}
                      >
                        {pg.explainer === 'cloud' ? 'cloud' : 'on-device'}
                      </span>
                      {pg.explanation}
                    </p>
                  )}
                  <div className="row">
                    <button
                      className="btn"
                      disabled={busy === pg.id}
                      onClick={() => runExplain(pg)}
                    >
                      {busy === pg.id
                        ? 'Thinking on-device…'
                        : pg.explanation
                          ? 'Re-explain + rebuild cards'
                          : 'Explain + make cards'}
                    </button>
                  </div>
                </div>
              ))}
        </div>
      ))}
      {err && <div className="error">{err}</div>}
      <div className="row">
        <button className="btn ghost" onClick={exportAll}>
          Export JSON
        </button>
      </div>
    </div>
  )
}

function downscale(dataUrl: string, max = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height))
      if (s === 1) return resolve(dataUrl)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * s)
      c.height = Math.round(img.height * s)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

function Capture({
  refresh,
  goLibrary,
}: {
  refresh: () => Promise<void>
  goLibrary: () => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function onFile(f: File | undefined) {
    if (!f) return
    const r = new FileReader()
    r.onload = async () => setPreview(await downscale(String(r.result)))
    r.readAsDataURL(f)
  }

  async function runOcr() {
    if (!preview) return
    setBusy(true)
    setErr(null)
    try {
      setText(await ocrImage(preview))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'OCR failed.')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!text.trim()) return
    const pid = uid()
    await db.papers.add({
      id: pid,
      subject: 'Scanned',
      title: `Scan — ${new Date().toLocaleString()}`,
      year: new Date().getFullYear(),
      source: 'scan',
    })
    await db.pages.add({
      id: uid(),
      paperId: pid,
      image: preview ?? undefined,
      text: text.trim(),
      createdAt: Date.now(),
    })
    await refresh()
    goLibrary()
  }

  return (
    <div className="card">
      <h3>Snap a past paper</h3>
      <p>Photo never leaves the device. OCR runs locally.</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="row">
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Take / upload photo
        </button>
        <button
          className="btn ghost"
          disabled={!preview || busy}
          onClick={runOcr}
        >
          {busy ? 'Reading…' : 'Read text'}
        </button>
      </div>
      {preview && (
        <img src={preview} alt="scan preview" className="preview" />
      )}
      <textarea
        className="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Extracted text lands here — edit before saving."
      />
      {err && <div className="error">{err}</div>}
      <div className="row">
        <button className="btn" disabled={!text.trim()} onClick={save}>
          Save to library
        </button>
      </div>
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Study({ cards, refresh }: { cards: Card[]; refresh: () => Promise<void> }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState<{ ok: number; total: number }>({
    ok: 0,
    total: 0,
  })

  useEffect(() => {
    db.attempts.toArray().then((a) => {
      setScore({
        ok: a.filter((x) => x.correct).length,
        total: a.length,
      })
    })
  }, [cards.length])

  if (cards.length === 0)
    return (
      <div className="card empty">
        <h3>No cards yet</h3>
        <p>Open Library, pick a paper, hit Explain + make cards.</p>
      </div>
    )

  const card = cards[idx % cards.length]
  const opts = useMemo(() => {
    const distractors = shuffle(
      cards.filter((c) => c.id !== card.id).map((c) => c.back),
    ).slice(0, 3)
    return shuffle([card.back, ...distractors])
  }, [cards, card])

  async function pick(o: string) {
    if (picked !== null) return
    setPicked(o)
    const correct = o === card.back
    await db.attempts.add({
      id: uid(),
      pageId: card.pageId,
      correct,
      createdAt: Date.now(),
    })
    setScore((s) => ({ ok: s.ok + (correct ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setPicked(null)
    setIdx((i) => (i + 1) % cards.length)
    refresh()
  }

  return (
    <div>
      <div className="progress">
        <div
          className="bar"
          style={{ width: `${((idx % cards.length) / cards.length) * 100}%` }}
        />
      </div>
      <div className="card">
        <p className="meta">
          card {(idx % cards.length) + 1} / {cards.length} · score {score.ok}/
          {score.total}
        </p>
        <h3 className="q">{card.front}</h3>
        {opts.map((o, i) => (
          <button
            key={`${idx}-${i}`}
            className={`quiz-opt${picked === null ? '' : o === card.back ? ' right' : picked === o ? ' wrong' : ''}`}
            onClick={() => pick(o)}
            disabled={picked !== null}
          >
            {o}
          </button>
        ))}
        {picked !== null && (
          <div className="row">
            <button className="btn" onClick={next}>
              Next card
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
