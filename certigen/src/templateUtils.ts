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
  return {
    dataUrl,
    width: img.naturalWidth,
    height: img.naturalHeight,
    format: file.type === 'image/jpeg' ? 'JPEG' : 'PNG',
  }
}

export const getPdfTemplate = async (file: File, targetDpi = 300): Promise<TemplateImage> => {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  try {
    const page = await pdf.getPage(1)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = targetDpi / 72
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not supported in this browser.')
    await page.render({ canvasContext: ctx, viewport }).promise
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      format: 'PNG',
    }
  } finally {
    pdf.destroy()
  }
}