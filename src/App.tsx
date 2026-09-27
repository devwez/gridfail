import { useCallback, useEffect, useRef, useState } from 'react'
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

export default function App() {
  const online = useOnline()
  const [tab, setTab] = useState<Tab>('library')
  const [papers, setPapers] = useState<Paper[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [openPaper, setOpenPaper] = useState<string | null>(null)
  const [cards, setCards] = useState<Card[]>([])

  const refresh = useCallback(async () => {
    await ensureSeed()
    setPapers(await db.papers.toArray())
    setPages(await db.pages.toArray())
    setCards(await db.cards.toArray())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <>
      <header className="top">
        <div className="brand">
          Grid<span>Fail</span>
        </div>
        <div className={`net-pill ${online ? 'on' : 'off'}`}>
          {online ? '● ONLINE' : '○ OFFLINE — fully working'}
        </div>
      </header>

      <nav className="tabs">
        {(['library', 'capture', 'study'] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

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
      {tab === 'capture' && <Capture refresh={refresh} goLibrary={() => setTab('library')} />}
      {tab === 'study' && <Study cards={cards} refresh={refresh} />}
    </>
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

  async function runExplain(page: Page) {
    setBusy(page.id)
    setErr(null)
    try {
      const { out, by } = await explain(page.text)
      await db.pages.update(page.id, {
        explanation: out,
        explainer: by === 'cloud' ? 'cloud' : 'local',
      })
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

  return (
    <div>
      {papers.map((p) => (
        <div className="card" key={p.id}>
          <h3>{p.title}</h3>
          <p>
            <span className="pill">{p.subject}</span>
            <span className="pill">{p.year}</span>
            <span className="pill">{p.source}</span>
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
                <div className="card" key={pg.id} style={{ marginTop: 10 }}>
                  <p style={{ color: 'var(--text)' }}>{pg.text}</p>
                  {pg.explanation && (
                    <p>
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
    </div>
  )
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
    r.onload = () => setPreview(String(r.result))
    r.readAsDataURL(f)
  }

  async function runOcr() {
    if (!preview) return
    setBusy(true)
    setErr(null)
    try {
      const t = await ocrImage(preview)
      setText(t)
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
        <button className="btn ghost" disabled={!preview || busy} onClick={runOcr}>
          {busy ? 'Reading…' : 'Read text'}
        </button>
      </div>
      {preview && (
        <img
          src={preview}
          alt="scan preview"
          style={{ width: '100%', borderRadius: 10, marginTop: 12 }}
        />
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

function Study({ cards, refresh }: { cards: Card[]; refresh: () => Promise<void> }) {
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(false)
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
      <div className="card">
        <h3>No cards yet</h3>
        <p>Open Library, pick a paper, hit Explain + make cards.</p>
      </div>
    )

  const card = cards[Math.min(idx, cards.length - 1)]

  async function grade(ok: boolean) {
    await db.attempts.add({
      id: uid(),
      pageId: card.pageId,
      correct: ok,
      createdAt: Date.now(),
    })
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }))
    setShow(false)
    setIdx((i) => (i + 1) % cards.length)
    refresh()
  }

  return (
    <div>
      <div className="card">
        <p className="meta">
          card {Math.min(idx + 1, cards.length)} / {cards.length} · score{' '}
          {score.ok}/{score.total}
        </p>
        <h3 style={{ marginTop: 8 }}>{card.front}</h3>
        {show && <p style={{ color: 'var(--text)' }}>{card.back}</p>}
        <div className="row">
          {!show ? (
            <button className="btn" onClick={() => setShow(true)}>
              Reveal
            </button>
          ) : (
            <>
              <button className="btn" onClick={() => grade(true)}>
                Got it
              </button>
              <button className="btn ghost" onClick={() => grade(false)}>
                Missed
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
