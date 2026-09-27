import Dexie, { type Table } from 'dexie'

export interface Paper {
  id: string
  subject: string
  title: string
  year: number
  source: 'seed' | 'scan'
}

export interface Page {
  id: string
  paperId: string
  image?: string // dataURL, scan only
  text: string
  explanation?: string
  explainer?: 'instant' | 'local' | 'cloud'
  createdAt: number
}

export interface Card {
  id: string
  pageId: string
  front: string
  back: string
}

export interface Attempt {
  id: string
  pageId: string
  correct: boolean
  createdAt: number
}

class GridDb extends Dexie {
  papers!: Table<Paper, string>
  pages!: Table<Page, string>
  cards!: Table<Card, string>
  attempts!: Table<Attempt, string>

  constructor() {
    super('gridfail')
    this.version(1).stores({
      papers: 'id, subject',
      pages: 'id, paperId',
      cards: 'id, pageId',
      attempts: 'id, pageId',
    })
  }
}

export const db = new GridDb()
export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
