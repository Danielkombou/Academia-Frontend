import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import './App.css'
import mammoth from "mammoth/mammoth.browser"
import { isPdfFile, getImageTemplate, getPdfTemplate, type TemplateImage } from './templateUtils'
import { supportsStreamingZip, streamZipToDisk } from './zipUtils'
import { formatCertificateName } from './nameFormat'

import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { StepTemplate } from './components/StepTemplate'
import { StepNames } from './components/StepNames'
import { StepPosition } from './components/StepPosition'
import { StepPreview } from './components/StepPreview'
import { StepDone } from './components/StepDone'
import { Footer } from './components/Footer'

interface Recipient {
  name: string
  [key: string]: string
}

export default function App() {
  const [step, setStep] = useState<number>(0)
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState<string>('')
  const [templateDims, setTemplateDims] = useState<{ width: number; height: number } | null>(null)
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: 'Daniel Kombou' },
    { name: 'Alice Smith' },
    { name: 'Bob Johnson' },
  ])
  const [columns, setColumns] = useState<string[]>(['name'])
  const [nameColumn, setNameColumn] = useState<string>('name')
  const [textPositions, setTextPositions] = useState({
    name: { x: 50, y: 53, fontSize: 36 },
  })
  const [nameFormatOpts, setNameFormatOpts] = useState({
    fullNamesCount: 2,
    abbreviationsCount: 999,
  })
  const [nameColor, setNameColor] = useState<string>('#1f2847')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedPdfs, setGeneratedPdfs] = useState<{ name: string; blob: Blob }[]>([])

  const handleStartGenerating = () => {
    setStep(1)
    const element = document.getElementById('generator-flow')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setTemplateFile(file)
      try {
        const template: TemplateImage = isPdfFile(file)
          ? await getPdfTemplate(file)
          : await getImageTemplate(file)
        setTemplatePreviewUrl(template.dataUrl)
        setTemplateDims({ width: template.width, height: template.height })
      } catch {
        setTemplateFile(null)
        setTemplatePreviewUrl('')
        setTemplateDims(null)
        alert('Sorry, this template could not be loaded. Please try a different file.')
      }
    }
  }

  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSpreadsheetFile(file)
      const reader = new FileReader()

      reader.onload = async (event) => {
        const content = event.target?.result
        if (!content) return

        const isDocx = file.name.toLowerCase().endsWith('.docx')
        if (isDocx) {
          try {
            const result = await mammoth.extractRawText({ arrayBuffer: content as ArrayBuffer })
            parseNamesFile(result.value)
          } catch {
            alert('Could not read the .docx file. Please make sure it is a valid Word document.')
          }
        } else {
          parseNamesFile(content as string)
        }
      }

      if (file.name.toLowerCase().endsWith('.docx')) {
        reader.readAsArrayBuffer(file)
      } else {
        reader.readAsText(file)
      }
    }
  }

  const cleanName = (raw: string) =>
    raw.trim().replace(/^\s*\d+\s*[.)]\s*/, '').replace(/^["']|["']$/g, '')

  const parseNamesFile = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return

    const isCsv = lines.some(l => l.includes(','))

    if (isCsv) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
      setColumns(headers)
      setNameColumn(headers[0] || 'name')

      const parsedRecipients: Recipient[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
        const nameVal = cleanName(values[0] || lines[i])
        if (nameVal) {
          parsedRecipients.push({ name: nameVal })
        }
      }
      if (parsedRecipients.length > 0) {
        setRecipients(parsedRecipients)
      }
    } else {
      const parsedRecipients: Recipient[] = lines.map(l => ({ name: cleanName(l) }))
      setColumns(['name'])
      setNameColumn('name')
      setRecipients(parsedRecipients)
    }
  }

  const getPageSize = (): { orientation: 'landscape' | 'portrait'; widthMm: number; heightMm: number } => {
    if (templateDims) {
      const aspect = templateDims.width / templateDims.height
      if (aspect >= 1) {
        return { orientation: 'landscape', widthMm: 297, heightMm: 297 / aspect }
      }
      return { orientation: 'portrait', widthMm: 297 * aspect, heightMm: 297 }
    }
    return { orientation: 'landscape', widthMm: 297, heightMm: 210 }
  }

  const generateCertificatesPDFs = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    const pdfBlobs: { name: string; blob: Blob }[] = []
    const { orientation, widthMm: pageWidth, heightMm: pageHeight } = getPageSize()

    try {
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]
        const rawName = recipient[nameColumn] || recipient.name || 'Recipient'
        const nameVal = formatCertificateName(rawName, nameFormatOpts)

        const doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: [pageWidth, pageHeight],
        })

        if (templatePreviewUrl) {
          try {
            doc.addImage(templatePreviewUrl, 'PNG', 0, 0, pageWidth, pageHeight)
          } catch {
            // Fallback
          }
        } else {
          doc.setLineWidth(1.5)
          doc.setDrawColor(170, 59, 255)
          doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
        }

        doc.setTextColor(nameColor)
        doc.setFont('times', 'bold')
        doc.setFontSize(textPositions.name.fontSize)
        const nameX = (textPositions.name.x / 100) * pageWidth
        const nameY = (textPositions.name.y / 100) * pageHeight
        doc.text(nameVal, nameX, nameY, { align: 'center' })

        const sanitizedName = rawName.replace(/[^a-zA-Z0-9]/g, '_')
        pdfBlobs.push({
          name: `Certificate_${sanitizedName}.pdf`,
          blob: doc.output('blob'),
        })

        setGenerationProgress(Math.round(((i + 1) / recipients.length) * 100))
        // Yield so the browser can repaint and garbage-collect each doc
        await new Promise(r => setTimeout(r, 20))
      }

      setGeneratedPdfs(pdfBlobs)
      setIsGenerating(false)
      setStep(5)
    } catch (err) {
      console.error('Certificate generation failed:', err)
      setIsGenerating(false)
      alert('Generation failed — your browser may have run out of memory. Try fewer recipients or a smaller template.')
    }
  }

  const downloadZipFallback = async () => {
    const zip = new JSZip()
    for (const { name, blob } of generatedPdfs) {
      zip.file(name, blob)
    }
    // PDFs are already compressed internally, so STORE avoids a costly re-deflate
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'STORE',
      compressionOptions: { level: 0 },
    })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Certificates_Batch.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadZip = async () => {
    if (generatedPdfs.length === 0) return
    if (supportsStreamingZip()) {
      try {
        await streamZipToDisk(generatedPdfs, 'Certificates_Batch.zip')
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Fall back on unexpected failures
      }
    }
    await downloadZipFallback()
  }

  const downloadSinglePDF = (pdf: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(pdf.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = pdf.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    setStep(0)
    setTemplateFile(null)
    setTemplatePreviewUrl('')
    setTemplateDims(null)
    setSpreadsheetFile(null)
    setIsGenerating(false)
    setGeneratedPdfs([])
  }

  return (
    <div className="certigen-app min-h-screen bg-white dark:bg-[#16171d] text-[#6b6375] dark:text-[#9ca3af]">
      <Header />

      <Hero onStart={handleStartGenerating} />

      <div className="ticks"></div>

      <section id="generator-flow" className="flow-section max-w-3xl mx-auto py-16 px-4 flex flex-col gap-8">
        {step === 0 && (
          <div className="flow-prompt-card text-center p-8 bg-gray-50 dark:bg-[#1f2028] rounded-2xl border border-gray-200 dark:border-[#2e303a]">
            <h2 className="text-2xl font-semibold text-[#08060d] dark:text-[#f3f4f6] mb-3">Ready to create your batch?</h2>
            <p className="text-base text-[#6b6375]">Click the button above to start uploading your template and names file.</p>
          </div>
        )}

        <StepTemplate
          step={step}
          templateFile={templateFile}
          onTemplateUpload={handleTemplateUpload}
          onNext={() => setStep(2)}
          onEdit={() => setStep(1)}
        />

        <StepNames
          step={step}
          spreadsheetFile={spreadsheetFile}
          recipientCount={recipients.length}
          onSpreadsheetUpload={handleSpreadsheetUpload}
          onNext={() => setStep(3)}
          onEdit={() => setStep(2)}
        />

        <StepPosition
          step={step}
          columns={columns}
          nameColumn={nameColumn}
          setNameColumn={setNameColumn}
          textPositions={textPositions}
          setTextPositions={setTextPositions}
          nameFormatOpts={nameFormatOpts}
          setNameFormatOpts={setNameFormatOpts}
          nameColor={nameColor}
          setNameColor={setNameColor}
          onNext={() => setStep(4)}
          onEdit={() => setStep(3)}
        />

        <StepPreview
          step={step}
          templatePreviewUrl={templatePreviewUrl}
          templateDims={templateDims}
          recipients={recipients}
          nameColumn={nameColumn}
          textPositions={textPositions}
          nameFormatOpts={nameFormatOpts}
          nameColor={nameColor}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          onGenerate={generateCertificatesPDFs}
        />

        <StepDone
          step={step}
          recipientCount={recipients.length}
          generatedPdfs={generatedPdfs}
          onDownloadZip={downloadZip}
          onDownloadSingle={downloadSinglePDF}
          onReset={resetAll}
        />
      </section>

      <Footer />
    </div>
  )
}
