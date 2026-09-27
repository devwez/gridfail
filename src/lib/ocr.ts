import { createWorker } from 'tesseract.js'

let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null =
  null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const w = await createWorker('eng')
      return w
    })()
  }
  return workerPromise
}

export async function ocrImage(
  image: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const worker = await getWorker()
  const { data } = await worker.recognize(image)
  onProgress?.(100)
  const text = data.text.trim()
  if (!text) throw new Error('No text found in this image. Try closer crop.')
  return text
}
