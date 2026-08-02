import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import './App.css'

interface Recipient {
  name: string
  [key: string]: string
}

export default function App() {
  const [step, setStep] = useState<number>(0)
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState<string>('')
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: 'Daniel Kombou' },
    { name: 'Alice Smith' },
    { name: 'Bob Johnson' },
  ])
  const [columns, setColumns] = useState<string[]>(['name'])
  const [nameColumn, setNameColumn] = useState<string>('name')
  const [textPositions, setTextPositions] = useState({
    name: { x: 50, y: 50, fontSize: 36 },
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedZipBlob, setGeneratedZipBlob] = useState<Blob | null>(null)
  const [generatedPdfs, setGeneratedPdfs] = useState<{ name: string; pdf: jsPDF }[]>([])

  const handleStartGenerating = () => {
    setStep(1)
    const element = document.getElementById('generator-flow')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setTemplateFile(file)
      const url = URL.createObjectURL(file)
      setTemplatePreviewUrl(url)
    }
  }

  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSpreadsheetFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        if (text) {
          parseCSV(text)
        }
      }
      reader.readAsText(file)
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(l => l.trim() !== '')
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
      setColumns(headers)
      setNameColumn(headers[0] || 'name')
      
      const parsedRecipients: Recipient[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
        const nameVal = values[0] || lines[i].trim().replace(/^["']|["']$/g, '')
        if (nameVal) {
          parsedRecipients.push({ name: nameVal })
        }
      }
      if (parsedRecipients.length > 0) {
        setRecipients(parsedRecipients)
      }
    }
  }

  const generateCertificatesPDFs = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    const zip = new JSZip()
    const pdfList: { name: string; pdf: jsPDF }[] = []

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      const nameVal = recipient.name || 'Recipient'

      // Create PDF in landscape A4 (297 x 210 mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      // If template image exists, draw background
      if (templatePreviewUrl) {
        try {
          doc.addImage(templatePreviewUrl, 'PNG', 0, 0, 297, 210)
        } catch {
          // Fallback if image type unsupported
        }
      } else {
        // Default clean border background
        doc.setLineWidth(1.5)
        doc.setDrawColor(170, 59, 255)
        doc.rect(10, 10, 277, 190)
      }

      // Add name text field
      doc.setTextColor(30, 30, 30)
      doc.setFont('times', 'bold')
      doc.setFontSize(textPositions.name.fontSize)
      const nameX = (textPositions.name.x / 100) * 297
      const nameY = (textPositions.name.y / 100) * 210
      doc.text(nameVal, nameX, nameY, { align: 'center' })

      const pdfBlob = doc.output('blob')
      const sanitizedName = nameVal.replace(/[^a-zA-Z0-9]/g, '_')
      zip.file(`Certificate_${sanitizedName}.pdf`, pdfBlob)
      pdfList.push({ name: `Certificate_${sanitizedName}.pdf`, pdf: doc })

      setGenerationProgress(Math.round(((i + 1) / recipients.length) * 100))
      await new Promise(r => setTimeout(r, 20)) // yield thread
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    setGeneratedZipBlob(zipBlob)
    setGeneratedPdfs(pdfList)
    setIsGenerating(false)
    setStep(5)
  }

  const downloadZip = () => {
    if (!generatedZipBlob) return
    const url = URL.createObjectURL(generatedZipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Certificates_Batch.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadSinglePDF = (pdfObj: { name: string; pdf: jsPDF }) => {
    pdfObj.pdf.save(pdfObj.name)
  }

  const resetAll = () => {
    setStep(0)
    setTemplateFile(null)
    setTemplatePreviewUrl('')
    setSpreadsheetFile(null)
    setIsGenerating(false)
    setGeneratedZipBlob(null)
    setGeneratedPdfs([])
  }

  return (
    <div className="certigen-app min-h-screen bg-white dark:bg-[#16171d] text-[#6b6375] dark:text-[#9ca3af]">
      {/* Header */}
      <header className="app-header flex justify-between items-center px-6 lg:px-12 py-5 border-b border-gray-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] sticky top-0 z-50">
        <div className="logo-container flex items-center gap-3 font-bold text-xl text-[#08060d] dark:text-[#f3f4f6]">
          <span className="text-2xl">📜</span>
          <span>CertiGen</span>
        </div>
        <nav className="nav-links flex items-center gap-6">
          <a href="#pricing" onClick={(e) => { e.preventDefault(); alert('Pricing plans coming soon!'); }} className="hover:text-[#08060d] dark:hover:text-[#f3f4f6] font-medium transition-colors">Pricing</a>
          <a href="#docs" onClick={(e) => { e.preventDefault(); alert('Documentation coming soon!'); }} className="hover:text-[#08060d] dark:hover:text-[#f3f4f6] font-medium transition-colors">Docs</a>
          <button className="login-btn px-4 py-2 border border-gray-300 dark:border-[#2e303a] rounded-lg font-medium text-[#08060d] dark:text-[#f3f4f6] hover:border-[#aa3bff] transition-all" onClick={() => alert('Login modal coming soon!')}>Login</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section py-20 px-4 text-center flex flex-col items-center">
        <div className="hero-badge inline-flex px-3.5 py-1.5 bg-[#aa3bff]/10 text-[#aa3bff] rounded-full text-sm font-semibold mb-6 border border-[#aa3bff]/30">
          ⚡ Instant Bulk Certificate Generation & PDF Export
        </div>
        <h1 className="text-4xl lg:text-6xl font-medium tracking-tight text-[#08060d] dark:text-[#f3f4f6] mb-6 max-w-3xl">
          Generate Certificates in Seconds
        </h1>
        <p className="hero-subtitle text-lg lg:text-xl text-[#6b6375] dark:text-[#9ca3af] max-w-2xl mb-10 leading-relaxed">
          Upload a template, upload your names file,<br />
          and download hundreds of certificates instantly.
        </p>
        <button className="primary-btn hero-cta px-8 py-4 bg-[#aa3bff] hover:bg-[#9328ee] text-white font-semibold text-lg rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5" onClick={handleStartGenerating}>
          Start Generating
        </button>
      </section>

      <div className="ticks"></div>

      {/* Generator Flow Section */}
      <section id="generator-flow" className="flow-section max-w-3xl mx-auto py-16 px-4 flex flex-col gap-8">
        {step === 0 && (
          <div className="flow-prompt-card text-center p-8 bg-gray-50 dark:bg-[#1f2028] rounded-2xl border border-gray-200 dark:border-[#2e303a]">
            <h2 className="text-2xl font-semibold text-[#08060d] dark:text-[#f3f4f6] mb-3">Ready to create your batch?</h2>
            <p className="text-base text-[#6b6375]">Click the button above to start uploading your template and names file.</p>
          </div>
        )}

        {/* Step 1: Upload Template */}
        {step >= 1 && (
          <div className={`step-card p-6 lg:p-8 rounded-2xl border transition-all ${step === 1 ? 'border-[#aa3bff]/50 shadow-xl bg-white dark:bg-[#1f2028]' : 'border-gray-200 dark:border-[#2e303a] bg-gray-50 dark:bg-[#1f2028]/50'}`}>
            <div className="step-header flex items-center gap-4 mb-4">
              <span className="step-number px-3 py-1 bg-[#aa3bff]/10 text-[#aa3bff] font-mono text-sm font-bold rounded-md border border-[#aa3bff]/30">Step 1</span>
              <h3 className="text-xl font-semibold text-[#08060d] dark:text-[#f3f4f6]">Upload Certificate Template</h3>
            </div>
            {step === 1 ? (
              <div className="dropzone flex flex-col items-center gap-4">
                <input
                  type="file"
                  id="template-upload"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleTemplateUpload}
                  className="hidden"
                />
                <label htmlFor="template-upload" className="dropzone-label w-full border-2 border-dashed border-gray-300 dark:border-[#2e303a] rounded-xl p-10 text-center cursor-pointer hover:border-[#aa3bff] hover:bg-[#aa3bff]/5 transition-all">
                  <div className="dropzone-icon text-4xl mb-3">📄</div>
                  <p className="text-base font-medium text-[#08060d] dark:text-[#f3f4f6]"><strong>Drop your PNG/JPG template here</strong> or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Recommended landscape 2970x2100px</p>
                  {templateFile && <span className="file-selected inline-block mt-3 text-sm text-[#aa3bff] font-semibold">Selected: {templateFile.name}</span>}
                </label>
                {templateFile && (
                  <button className="primary-btn step-next-btn px-6 py-3 bg-[#08060d] dark:bg-[#f3f4f6] text-white dark:text-[#08060d] font-semibold rounded-lg self-end hover:opacity-90 transition-all" onClick={() => setStep(2)}>
                    Continue to Step 2 →
                  </button>
                )}
              </div>
            ) : (
              <div className="step-summary flex justify-between items-center text-sm font-medium text-[#08060d] dark:text-[#f3f4f6]">
                <span className="flex items-center gap-2">📄 {templateFile?.name || 'template.png'}</span>
                <button className="edit-step-btn px-3 py-1 border border-gray-300 dark:border-[#2e303a] rounded text-xs font-semibold hover:border-[#08060d]" onClick={() => setStep(1)}>Change</button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload Names File */}
        {step >= 2 && (
          <div className={`step-card p-6 lg:p-8 rounded-2xl border transition-all ${step === 2 ? 'border-[#aa3bff]/50 shadow-xl bg-white dark:bg-[#1f2028]' : step > 2 ? 'border-gray-200 dark:border-[#2e303a] bg-gray-50 dark:bg-[#1f2028]/50' : 'opacity-40 pointer-events-none'}`}>
            <div className="step-header flex items-center gap-4 mb-4">
              <span className="step-number px-3 py-1 bg-[#aa3bff]/10 text-[#aa3bff] font-mono text-sm font-bold rounded-md border border-[#aa3bff]/30">Step 2</span>
              <h3 className="text-xl font-semibold text-[#08060d] dark:text-[#f3f4f6]">Upload Names File (CSV / TXT)</h3>
            </div>
            {step === 2 ? (
              <div className="dropzone flex flex-col items-center gap-4">
                <input
                  type="file"
                  id="spreadsheet-upload"
                  accept=".csv,.txt"
                  onChange={handleSpreadsheetUpload}
                  className="hidden"
                />
                <label htmlFor="spreadsheet-upload" className="dropzone-label w-full border-2 border-dashed border-gray-300 dark:border-[#2e303a] rounded-xl p-10 text-center cursor-pointer hover:border-[#aa3bff] hover:bg-[#aa3bff]/5 transition-all">
                  <div className="dropzone-icon text-4xl mb-3">📊</div>
                  <p className="text-base font-medium text-[#08060d] dark:text-[#f3f4f6]"><strong>Drop your names list here</strong> (one name per line or CSV)</p>
                  <p className="text-xs text-gray-400 mt-1">Loaded with {recipients.length} demo recipients (or upload your own)</p>
                  {spreadsheetFile && <span className="file-selected inline-block mt-3 text-sm text-[#aa3bff] font-semibold">Selected: {spreadsheetFile.name}</span>}
                </label>
                <div className="flex justify-between w-full mt-2">
                  <span className="text-xs text-gray-500">{recipients.length} names loaded</span>
                  <button className="primary-btn step-next-btn px-6 py-3 bg-[#08060d] dark:bg-[#f3f4f6] text-white dark:text-[#08060d] font-semibold rounded-lg hover:opacity-90 transition-all" onClick={() => setStep(3)}>
                    Continue to Step 3 →
                  </button>
                </div>
              </div>
            ) : (
              <div className="step-summary flex justify-between items-center text-sm font-medium text-[#08060d] dark:text-[#f3f4f6]">
                <span>📊 {spreadsheetFile?.name || 'names.csv'} ({recipients.length} names)</span>
                <button className="edit-step-btn px-3 py-1 border border-gray-300 dark:border-[#2e303a] rounded text-xs font-semibold hover:border-[#08060d]" onClick={() => setStep(2)}>Change</button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Map Column & Position */}
        {step >= 3 && (
          <div className={`step-card p-6 lg:p-8 rounded-2xl border transition-all ${step === 3 ? 'border-[#aa3bff]/50 shadow-xl bg-white dark:bg-[#1f2028]' : step > 3 ? 'border-gray-200 dark:border-[#2e303a] bg-gray-50 dark:bg-[#1f2028]/50' : 'opacity-40 pointer-events-none'}`}>
            <div className="step-header flex items-center gap-4 mb-4">
              <span className="step-number px-3 py-1 bg-[#aa3bff]/10 text-[#aa3bff] font-mono text-sm font-bold rounded-md border border-[#aa3bff]/30">Step 3</span>
              <h3 className="text-xl font-semibold text-[#08060d] dark:text-[#f3f4f6]">Map Name Column & Position</h3>
            </div>
            {step === 3 ? (
              <div className="mapping-container flex flex-col gap-6">
                <div className="mapping-row flex flex-col gap-1 p-4 bg-gray-50 dark:bg-[#16171d] rounded-lg border border-gray-200 dark:border-[#2e303a]">
                  <label className="text-xs font-semibold uppercase text-gray-500">Name Column</label>
                  <select
                    value={nameColumn}
                    onChange={(e) => setNameColumn(e.target.value)}
                    className="p-2 rounded border border-gray-300 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] text-sm text-[#08060d] dark:text-[#f3f4f6]"
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Slider for name positioning */}
                <div className="p-4 bg-gray-50 dark:bg-[#16171d] rounded-xl border border-gray-200 dark:border-[#2e303a] flex flex-col gap-4">
                  <h4 className="text-sm font-semibold text-[#08060d] dark:text-[#f3f4f6]">Name Vertical Position ({textPositions.name.y}%)</h4>
                  <input 
                    type="range" 
                    min="20" 
                    max="80" 
                    value={textPositions.name.y} 
                    onChange={e => setTextPositions({...textPositions, name: {...textPositions.name, y: Number(e.target.value)}})} 
                    className="w-full" 
                  />
                </div>

                <button className="primary-btn step-next-btn px-6 py-3 bg-[#08060d] dark:bg-[#f3f4f6] text-white dark:text-[#08060d] font-semibold rounded-lg self-end hover:opacity-90 transition-all" onClick={() => setStep(4)}>
                  Continue to Preview →
                </button>
              </div>
            ) : (
              <div className="step-summary flex justify-between items-center text-sm font-medium text-[#08060d] dark:text-[#f3f4f6]">
                <span>Name Column: {nameColumn}</span>
                <button className="edit-step-btn px-3 py-1 border border-gray-300 dark:border-[#2e303a] rounded text-xs font-semibold hover:border-[#08060d]" onClick={() => setStep(3)}>Edit</button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Preview */}
        {step >= 4 && (
          <div className={`step-card p-6 lg:p-8 rounded-2xl border transition-all ${step === 4 ? 'border-[#aa3bff]/50 shadow-xl bg-white dark:bg-[#1f2028]' : step > 4 ? 'border-gray-200 dark:border-[#2e303a] bg-gray-50 dark:bg-[#1f2028]/50' : 'opacity-40 pointer-events-none'}`}>
            <div className="step-header flex items-center gap-4 mb-4">
              <span className="step-number px-3 py-1 bg-[#aa3bff]/10 text-[#aa3bff] font-mono text-sm font-bold rounded-md border border-[#aa3bff]/30">Step 4</span>
              <h3 className="text-xl font-semibold text-[#08060d] dark:text-[#f3f4f6]">Certificate Preview & Generation</h3>
            </div>
            {step === 4 ? (
              <div className="preview-container flex flex-col items-center gap-6">
                <div 
                  className="certificate-mockup relative w-full max-w-lg aspect-[1.4/1] bg-gradient-to-br from-gray-50 to-gray-200 border-4 border-[#aa3bff] rounded-xl flex flex-col items-center justify-center p-6 shadow-2xl text-center overflow-hidden"
                  style={{
                    backgroundImage: templatePreviewUrl ? `url(${templatePreviewUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!templatePreviewUrl && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/40 flex flex-col items-center justify-center p-6"></div>
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-2 w-full">
                    <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Certificate of Completion</span>
                    <div className="text-2xl lg:text-3xl font-serif font-bold text-[#08060d] border-b-2 border-[#aa3bff] pb-1 px-4 my-2">
                      {recipients[0] ? recipients[0].name || 'Daniel Kombou' : 'Daniel Kombou'}
                    </div>
                  </div>
                </div>

                <div className="recipients-count text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Recipients Ready: <strong className="text-[#aa3bff]">{recipients.length}</strong>
                </div>

                {isGenerating && (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                      <div className="bg-[#aa3bff] h-3 rounded-full transition-all duration-150" style={{ width: `${generationProgress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Generating PDFs... {generationProgress}%</span>
                  </div>
                )}

                <button
                  className="primary-btn generate-btn w-full py-4 bg-[#aa3bff] hover:bg-[#9328ee] text-white font-semibold rounded-xl shadow-lg transition-all"
                  onClick={generateCertificatesPDFs}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating Certificates...' : `Generate All ${recipients.length} Certificates`}
                </button>
              </div>
            ) : (
              <div className="step-summary flex justify-between items-center text-sm font-medium text-[#08060d] dark:text-[#f3f4f6]">
                <span>✨ Successfully generated {recipients.length} certificates</span>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="step-card success-card active p-8 rounded-2xl border border-[#aa3bff] bg-white dark:bg-[#1f2028] text-center flex flex-col items-center gap-6 shadow-2xl">
            <div className="success-icon text-5xl">✅</div>
            <div>
              <h2 className="text-2xl font-bold text-[#08060d] dark:text-[#f3f4f6] mb-2">Done!</h2>
              <p className="success-subtitle text-gray-600 dark:text-gray-400">{recipients.length} certificates successfully generated as standalone PDFs and zipped.</p>
            </div>
            
            <div className="download-actions flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button className="primary-btn download-btn flex-1 py-4 px-6 bg-[#aa3bff] hover:bg-[#9328ee] text-white font-semibold rounded-xl shadow-md transition-all" onClick={downloadZip}>
                📥 Download ZIP Archive
              </button>
              <button className="secondary-btn download-btn flex-1 py-4 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-[#08060d] dark:text-[#f3f4f6] font-semibold rounded-xl border border-gray-300 dark:border-gray-700 transition-all" onClick={() => downloadSinglePDF(generatedPdfs[0])}>
                📄 Download Sample PDF ({generatedPdfs[0]?.name || 'Certificate.pdf'})
              </button>
            </div>

            <button className="text-btn reset-btn text-[#aa3bff] font-semibold hover:underline mt-2" onClick={resetAll}>
              🔄 Generate Another Batch
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="app-footer py-10 text-center border-t border-gray-200 dark:border-[#2e303a] text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CertiGen. All rights reserved.</p>
      </footer>
    </div>
  )
}
