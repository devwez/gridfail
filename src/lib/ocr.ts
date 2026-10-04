import type { createWorker as createWorkerType } from 'tesseract.js'

// tesseract.js rides a dynamic import — first paint never pays for OCR.
// Type-only import above erases at compile, pulls zero bytes into bundle.
let workerPromise: Promise<
  Awaited<ReturnType<typeof createWorkerType>>
> | null = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return await createWorker('eng')
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
