import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { instant, isModelReady, makeCards, prefetchModel, upgrade } from './lib/ai'
import { db, uid, type Card, type Page, type Paper } from './lib/db'
import { ocrImage } from './lib/ocr'
import { ensureSeed } from './lib/seed'

type Tab = 'library' | 'capture' | 'study'

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    let dead = false
    const check = () => {
      // events lie in some webviews — probe the same-origin shell
      fetch('/favicon.svg', { method: 'HEAD', cache: 'no-store' }).then(
        () => !dead && setOnline(true),
        () => !dead && setOnline(false),
      )
    }
    const on = () => setOnline(navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    const t = setInterval(check, 3000)
    return () => {
      dead = true
      clearInterval(t)
      window.removeEventListener('online', on)
      window.removeEventListener('offline', on)
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

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const BookIcon = () => (
  <svg {...iconProps}>
    <path d="M12 6C10 4.5 7 4 4 4v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zm0 0v14" />
  </svg>
)
const CameraIcon = () => (
  <svg {...iconProps}>
    <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="3.2" />
  </svg>
)
const CardsIcon = () => (
  <svg {...iconProps}>
    <rect x="7" y="7" width="13" height="13" rx="2" />
    <path d="M4 15V5a1 1 0 0 1 1-1h9" />
  </svg>
)

const NAV: { id: Tab; label: string; icon: () => React.JSX.Element }[] = [
  { id: 'library', label: 'Library', icon: BookIcon },
  { id: 'capture', label: 'Capture', icon: CameraIcon },
  { id: 'study', label: 'Study', icon: CardsIcon },
]

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

  // Roving tabindex tablist: arrows move, selection follows focus.
  // Focus stays in the nav where the key was pressed (sidebar + mobile tabs
  // both stay mounted, so query the sibling buttons, not a shared ref).
  const onTabKey = (e: React.KeyboardEvent, id: Tab) => {
    const i = NAV.findIndex((n) => n.id === id)
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % NAV.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      next = (i - 1 + NAV.length) % NAV.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = NAV.length - 1
    if (next === null) return
    e.preventDefault()
    setTab(NAV[next].id)
    const sibs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]')
    ;(sibs?.[next] as HTMLElement | undefined)?.focus()
  }
  const tabBtn = (id: Tab) => ({
    role: 'tab' as const,
    'aria-selected': tab === id,
    tabIndex: tab === id ? 0 : -1,
    onKeyDown: (e: React.KeyboardEvent) => onTabKey(e, id),
    onClick: () => setTab(id),
  })

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="side">
        <div className="brand">
              <img src="/mark.png" alt="GridFail mark" className="brandmark" width="40" height="30" />
          Grid<span>Fail</span>
        </div>
        <nav aria-label="Primary" role="tablist" aria-orientation="vertical">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? 'active press' : 'press'}
              {...tabBtn(id)}
            >
              <Icon />
              {label}
              {id === 'study' && cards.length > 0 && ` · ${cards.length}`}
            </button>
          ))}
        </nav>
        <div className="foot">
          {online ? '● online' : '○ offline mode'}
          <br />
          zero backend · v0.1.0
        </div>
      </aside>

      <main className="col" id="main" tabIndex={-1}>
        <header className="top">
          <div className="brandcol">
            <div className="brand">
          <img src="/mark.png" alt="GridFail mark" className="brandmark" width="36" height="27" />
              Grid<span>Fail</span>
            </div>
            <div className="tagline">study when the grid fails</div>
          </div>
          <div className={`net-pill ${online ? 'on' : 'off'}`} role="status">
            {online ? '● ONLINE' : '○ OFFLINE — fully working'}
          </div>
        </header>

        <section className="stats">
          <Stat n={papers.length} label="papers" i={0} />
          <Stat n={pages.length} label="pages" i={1} />
          <Stat n={cards.length} label="cards" i={2} />
          <Stat
            n={attempts.length ? `${Math.round((ok / attempts.length) * 100)}%` : '—'}
            label="accuracy"
            i={3}
            hot
          />
        </section>

        <AnimatePresence mode="wait">
          <MotionConfig reducedMotion="user">
          <motion.div key={tab} {...fade} role="tabpanel" aria-label={`${tab} panel`}>
            {tab === 'library' && (
              <Library
                papers={papers}
                pages={pages}
                openPaper={openPaper}
                setOpenPaper={setOpenPaper}
                goStudy={() => setTab('study')}
                goCapture={() => setTab('capture')}
                refresh={refresh}
              />
            )}
            {tab === 'capture' && (
              <Capture refresh={refresh} goLibrary={() => setTab('library')} />
            )}
            {tab === 'study' && <Study cards={cards} refresh={refresh} goLibrary={() => setTab('library')} />}
          </motion.div>
          </MotionConfig>
        </AnimatePresence>
      </main>

      <nav className="tabs" aria-label="Sections" role="tablist">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? 'active press' : 'press'}
            {...tabBtn(id)}
          >
            <Icon />
            {label}
            {id === 'study' && cards.length > 0 && (
              <span className="count">{cards.length}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

function Stat({ n, label, i, hot }: { n: number | string; label: string; i: number; hot?: boolean }) {
  return (
    <div className={`stat fade-in-up${hot ? ' hot' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
      <div className="stat-l">{label}</div>
      <div className="stat-n">{n}</div>
    </div>
  )
}

function ViewHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <div className="view-head">
      <div className="view-eyebrow">{eyebrow}</div>
      <h2 className="view-title">{title}</h2>
      <p className="view-lede">{lede}</p>
    </div>
  )
}

function ModelPanel() {
  const [ready, setReady] = useState(isModelReady())
  const [pct, setPct] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function dl() {
    setPct(0)
    setErr(null)
    try {
      await prefetchModel(setPct)
      setReady(true)
      setPct(null)
    } catch (e) {
      setPct(null)
      setErr(e instanceof Error ? e.message : 'Download failed. Retry online.')
    }
  }

  if (ready)
    return (
      <div className="model ready">
        <span className="dot" /> Offline AI on board — answers upgrade with
        zero network
      </div>
    )
  return (
    <div className="model">
      <div className="model-row">
        <span>
          Answers start instant. Download the 80MB offline brain for AI
          upgrades.
        </span>
        <button className="btn press" disabled={pct !== null} onClick={dl}>
          {pct === null ? 'Download' : `${pct}%`}
        </button>
      </div>
      {pct !== null && (
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Model download progress"
        >
          <div className="bar" style={{ width: `${pct}%` }} />
        </div>
      )}
      {err && <div className="error" role="alert">{err}</div>}
    </div>
  )
}

function Library({
  papers,
  pages,
  openPaper,
  setOpenPaper,
  goStudy,
  goCapture,
  refresh,
}: {
  papers: Paper[]
  pages: Page[]
  openPaper: string | null
  setOpenPaper: (id: string | null) => void
  goStudy: () => void
  goCapture: () => void
  refresh: () => Promise<void>
}) {
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('All')
  const subjects = ['All', ...new Set(papers.map((p) => p.subject))]

  async function runExplain(page: Page) {
    setErr(null)
    // instant answer on screen in ms — no spinner staring contest
    const quick = instant(page.text)
    await db.pages.update(page.id, {
      explanation: quick,
      explainer: 'instant',
    })
    await db.cards.where('pageId').equals(page.id).delete()
    await db.cards.bulkAdd(
      makeCards(page.text, quick).map((c) => ({
        id: uid(),
        pageId: page.id,
        ...c,
      })),
    )
    await refresh()
    goStudy()
    // background upgrade: cloud if configured, else on-device model
    try {
      const up = await upgrade(page.text)
      if (up) {
        await db.pages.update(page.id, {
          explanation: up.out,
          explainer: up.by,
        })
        await db.cards.where('pageId').equals(page.id).delete()
        await db.cards.bulkAdd(
          makeCards(page.text, up.out).map((c) => ({
            id: uid(),
            pageId: page.id,
            ...c,
          })),
        )
        await refresh()
      }
    } catch {
      /* instant answer stands — honest offline */
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
      <div>
        <ViewHead
          eyebrow="Library"
          title="Your papers live here"
          lede="Seeded practice sets and your scans. Everything on this device, nothing in a cloud."
        />
        <div className="card empty">
          <div className="empty-icon" aria-hidden="true">
            <BookIcon />
          </div>
          <h3>No papers yet</h3>
          <p>Photograph a past paper and the text lands here, ready to explain.</p>
          <div className="row">
            <button className="btn primary press" onClick={goCapture}>
              Capture a page
            </button>
          </div>
        </div>
      </div>
    )

  return (
    <div>
      <ViewHead
        eyebrow="Library"
        title="Your papers live here"
        lede="Seeded practice sets and your scans. Everything on this device, nothing in a cloud."
      />
      <ModelPanel />
      <div className="chips">
        {subjects.map((s) => (
          <button
            key={s}
            className={filter === s ? 'active press' : 'press'}
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {shown.map((p, i) => (
        <div
          className="card card-interactive fade-in-up"
          key={p.id}
          style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}
        >
          <h3>{p.title}</h3>
          <div className="card-foot">
            <p>
              <span className="pill">{p.subject}</span>
              <span className="pill">{p.year}</span>
              <span className="pill">{p.source}</span>
              <span className="pill">
                {pages.filter((pg) => pg.paperId === p.id).length} pages
              </span>
            </p>
            <button
              className="btn ghost press"
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
                        className={`pill ${pg.explainer === 'cloud' ? 'cloud' : pg.explainer === 'instant' ? '' : 'local'}`}
                      >
                        {pg.explainer === 'cloud'
                          ? 'cloud'
                          : pg.explainer === 'instant'
                            ? 'instant'
                            : 'on-device AI'}
                      </span>
                      {pg.explanation}
                    </p>
                  )}
                  <div className="row">
                    <button
                      className="btn primary press"
                      onClick={() => runExplain(pg)}
                    >
                      {pg.explanation
                        ? 'Explain again + rebuild cards'
                        : 'Explain instantly + make cards'}
                    </button>
                  </div>
                </div>
              ))}
        </div>
      ))}
      {err && <div className="error" role="alert">{err}</div>}
      <div className="row">
        <button className="btn ghost press" onClick={exportAll}>
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
    <div>
      <ViewHead
        eyebrow="Capture"
        title="Snap a past paper"
        lede="The photo never leaves this device. Text is read on-device, then saved to your library."
      />
      <div className="card fade-in-up">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Upload photo of past paper"
        style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="row">
        <button className="btn primary press" onClick={() => fileRef.current?.click()}>
          Take / upload photo
        </button>
        <button
          className="btn ghost press"
          disabled={!preview || busy}
          onClick={runOcr}
        >
          {busy ? 'Reading…' : 'Read text'}
        </button>
      </div>
      {preview && (
        <img src={preview} alt="scan preview" className="preview" />
      )}
      {busy ? (
        <div style={{ marginTop: 10 }} aria-hidden="true">
          <div className="skeleton" style={{ height: 18, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 18, width: '60%' }} />
        </div>
      ) : (
        <textarea
          className="text"
          aria-label="Extracted text — edit before saving"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Extracted text lands here — edit before saving."
        />
      )}
      {busy && <div className="sr-only" role="status">Reading text…</div>}
      {err && <div className="error" role="alert">{err}</div>}
      <div className="row">
        <button className="btn primary press" disabled={!text.trim()} onClick={save}>
          Save to library
        </button>
      </div>
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

function Study({ cards, refresh, goLibrary }: { cards: Card[]; refresh: () => Promise<void>; goLibrary: () => void }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState<{ ok: number; total: number }>({
    ok: 0,
    total: 0,
  })
  const [order, setOrder] = useState<string[] | null>(null)

  useEffect(() => {
    db.attempts.toArray().then((a) => {
      setScore({
        ok: a.filter((x) => x.correct).length,
        total: a.length,
      })
      // worst-first: pages you miss float to the top. New cards first.
      const byPage = new Map<string, { ok: number; total: number }>()
      for (const x of a) {
        const e = byPage.get(x.pageId) ?? { ok: 0, total: 0 }
        e.total++
        if (x.correct) e.ok++
        byPage.set(x.pageId, e)
      }
      const acc = (c: Card) => {
        const e = byPage.get(c.pageId)
        return e && e.total > 0 ? e.ok / e.total : -1
      }
      setOrder(
        [...cards].sort((x, y) => acc(x) - acc(y)).map((c) => c.id),
      )
    })
  }, [cards])

  const deck = order
    ? order
        .map((id) => cards.find((c) => c.id === id))
        .filter((c): c is Card => !!c)
    : cards

  const card = deck.length ? deck[idx % deck.length] : null
  const opts = useMemo(() => {
    if (!card) return []
    const distractors = shuffle(
      cards.filter((c) => c.id !== card.id).map((c) => c.back),
    ).slice(0, 3)
    return shuffle([card.back, ...distractors])
  }, [cards, card])

  if (!card)
    return (
      <div>
        <ViewHead
          eyebrow="Study"
          title="Drill your weak spots"
          lede="Multiple choice, weakest first. Scores persist on this device."
        />
        <div className="card empty">
          <div className="empty-icon" aria-hidden="true">
            <CardsIcon />
          </div>
          <h3>Nothing to drill yet</h3>
          <p>Explain a page in the library and flashcards appear here.</p>
          <div className="row">
            <button className="btn primary press" onClick={goLibrary}>
              Open library
            </button>
          </div>
        </div>
      </div>
    )

  async function pick(o: string) {
    if (picked !== null || !card) return
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
    setIdx((i) => (i + 1) % deck.length)
    refresh()
  }

  return (
    <div>
      <ViewHead
        eyebrow="Study"
        title="Drill your weak spots"
        lede="Multiple choice, weakest first. Scores persist on this device."
      />
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={deck.length}
        aria-valuenow={(idx % deck.length) + 1}
        aria-label="Study progress"
      >
        <div
          className="bar"
          style={{ width: `${((idx % deck.length) / deck.length) * 100}%` }}
        />
      </div>
      <div className="card fade-in-up" key={card.id}>
        <p className="meta">
          card {(idx % deck.length) + 1} / {deck.length} · weakest first ·
          score {score.ok}/{score.total}
        </p>
        <h3 className="q">{card.front}</h3>
        {opts.map((o, i) => (
          <button
            key={`${idx}-${i}`}
            className={`quiz-opt press${picked === null ? '' : o === card.back ? ' right' : picked === o ? ' wrong' : ''}`}
            onClick={() => pick(o)}
            disabled={picked !== null}
          >
            <span className="qkey" aria-hidden="true">{'ABCD'[i] ?? '•'}</span>
            <span>{o}</span>
          </button>
        ))}
        {picked !== null && (
          <div className="row" aria-live="polite">
            <button className="btn primary press" onClick={next} autoFocus>
              Next card
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
