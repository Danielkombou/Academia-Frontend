import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export interface TemplateImage {
  dataUrl: string
  width: number
  height: number
  format: 'PNG' | 'JPEG'
}

export const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

// Longest side cap for the embedded template (~300 DPI across a 297mm page).
// Anything larger than this adds memory pressure for zero visible gain at print size.
const MAX_EMBED_SIDE_PX = 3508

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load the image template.'))
    img.src = src
  })
}

export const getImageTemplate = async (file: File): Promise<TemplateImage> => {
  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)
  const isJpeg = file.type === 'image/jpeg'

  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  if (longest <= MAX_EMBED_SIDE_PX) {
    return {
      dataUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: isJpeg ? 'JPEG' : 'PNG',
    }
  }

  const scale = MAX_EMBED_SIDE_PX / longest
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser.')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return {
    dataUrl: canvas.toDataURL(isJpeg ? 'image/jpeg' : 'image/png', 0.95),
    width: canvas.width,
    height: canvas.height,
    format: isJpeg ? 'JPEG' : 'PNG',
  }
}

export const getPdfTemplate = async (file: File, targetDpi = 300): Promise<TemplateImage> => {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  try {
    const page = await pdf.getPage(1)
    const baseViewport = page.getViewport({ scale: 1 })
    const longestPx = Math.max(baseViewport.width, baseViewport.height)
    // Never exceed ~300 DPI for the widest 297mm page, and never above the memory cap.
    const maxScale = MAX_EMBED_SIDE_PX / longestPx
    const scale = Math.min(targetDpi / 72, maxScale)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not supported in this browser.')
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    // JPEG at high quality: 5-10x smaller than PNG, which keeps each generated
    // PDF small enough that hundreds of certificates fit comfortably in memory.
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.95),
      width: canvas.width,
      height: canvas.height,
      format: 'JPEG',
    }
  } finally {
    loadingTask.destroy()
  }
}