import { useState } from 'react'
import './App.css'

export default function App() {
  const [step, setStep] = useState<number>(0) // 0: Landing hero, 1-4: Generator steps, 5: Done
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null)
  const [columnMapping, setColumnMapping] = useState({
    name: 'Full Name',
    course: 'Course',
    date: 'Date',
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleStartGenerating = () => {
    setStep(1)
    const element = document.getElementById('generator-flow')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTemplateFile(e.target.files[0])
    }
  }

  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSpreadsheetFile(e.target.files[0])
    }
  }

  const handleGenerateCertificates = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setStep(5)
    }, 1500)
  }

  const resetAll = () => {
    setStep(0)
    setTemplateFile(null)
    setSpreadsheetFile(null)
    setIsGenerating(false)
  }

  return (
    <div className="certigen-app">
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">📜</span>
          <span className="logo-text">CertiGen</span>
        </div>
        <nav className="nav-links">
          <a href="#pricing" onClick={(e) => { e.preventDefault(); alert('Pricing plans coming soon!'); }}>Pricing</a>
          <a href="#docs" onClick={(e) => { e.preventDefault(); alert('Documentation coming soon!'); }}>Docs</a>
          <button className="login-btn" onClick={() => alert('Login modal coming soon!')}>Login</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">⚡ Instant Bulk Certificate Generation</div>
        <h1>Generate Certificates in Seconds</h1>
        <p className="hero-subtitle">
          Upload a template, upload your Excel file,<br />
          and download hundreds of certificates instantly.
        </p>
        <button className="primary-btn hero-cta" onClick={handleStartGenerating}>
          Start Generating
        </button>
      </section>

      <div className="ticks"></div>

      {/* Generator Flow Section */}
      <section id="generator-flow" className="flow-section">
        {step === 0 && (
          <div className="flow-prompt-card">
            <h2>Ready to create your batch?</h2>
            <p>Click the button above to start uploading your template and data.</p>
          </div>
        )}

        {/* Step 1: Upload Template */}
        {(step >= 1) && (
          <div className={`step-card ${step === 1 ? 'active' : 'completed'}`}>
            <div className="step-header">
              <span className="step-number">Step 1</span>
              <h3>Upload Certificate Template</h3>
            </div>
            {step === 1 ? (
              <div className="dropzone">
                <input
                  type="file"
                  id="template-upload"
                  accept=".png,.pdf,.jpg,.jpeg"
                  onChange={handleTemplateUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="template-upload" className="dropzone-label">
                  <div className="dropzone-icon">📄</div>
                  <p><strong>Drop your PNG/PDF here</strong> or click to browse</p>
                  {templateFile && <span className="file-selected">Selected: {templateFile.name}</span>}
                </label>
                {templateFile && (
                  <button className="primary-btn step-next-btn" onClick={() => setStep(2)}>
                    Continue to Step 2
                  </button>
                )}
              </div>
            ) : (
              <div className="step-summary">
                <span>📄 {templateFile?.name || 'template.png'}</span>
                <button className="edit-step-btn" onClick={() => setStep(1)}>Change</button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload CSV/Excel */}
        {(step >= 2) && (
          <div className={`step-card ${step === 2 ? 'active' : step > 2 ? 'completed' : 'disabled'}`}>
            <div className="step-header">
              <span className="step-number">Step 2</span>
              <h3>Upload CSV/Excel File</h3>
            </div>
            {step === 2 ? (
              <div className="dropzone">
                <input
                  type="file"
                  id="spreadsheet-upload"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleSpreadsheetUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="spreadsheet-upload" className="dropzone-label">
                  <div className="dropzone-icon">📊</div>
                  <p><strong>Drop your spreadsheet here</strong> (.csv, .xlsx)</p>
                  {spreadsheetFile && <span className="file-selected">Selected: {spreadsheetFile.name}</span>}
                </label>
                {spreadsheetFile && (
                  <button className="primary-btn step-next-btn" onClick={() => setStep(3)}>
                    Continue to Step 3
                  </button>
                )}
              </div>
            ) : (
              <div className="step-summary">
                <span>📊 {spreadsheetFile?.name || 'recipients.xlsx'}</span>
                <button className="edit-step-btn" onClick={() => setStep(2)}>Change</button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Map Columns */}
        {(step >= 3) && (
          <div className={`step-card ${step === 3 ? 'active' : step > 3 ? 'completed' : 'disabled'}`}>
            <div className="step-header">
              <span className="step-number">Step 3</span>
              <h3>Map Columns</h3>
            </div>
            {step === 3 ? (
              <div className="mapping-container">
                <div className="mapping-row">
                  <label>Name</label>
                  <span className="arrow">←</span>
                  <select
                    value={columnMapping.name}
                    onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                  >
                    <option value="Full Name">Full Name</option>
                    <option value="Name">Name</option>
                    <option value="Participant">Participant</option>
                  </select>
                </div>
                <div className="mapping-row">
                  <label>Course</label>
                  <span className="arrow">←</span>
                  <select
                    value={columnMapping.course}
                    onChange={(e) => setColumnMapping({ ...columnMapping, course: e.target.value })}
                  >
                    <option value="Course">Course</option>
                    <option value="Program">Program</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div className="mapping-row">
                  <label>Date</label>
                  <span className="arrow">←</span>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                  >
                    <option value="Date">Date</option>
                    <option value="Completion Date">Completion Date</option>
                  </select>
                </div>
                <button className="primary-btn step-next-btn" onClick={() => setStep(4)}>
                  Continue
                </button>
              </div>
            ) : (
              <div className="step-summary">
                <span>Name ← {columnMapping.name}, Course ← {columnMapping.course}, Date ← {columnMapping.date}</span>
                <button className="edit-step-btn" onClick={() => setStep(3)}>Edit</button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Preview */}
        {(step >= 4) && (
          <div className={`step-card ${step === 4 ? 'active' : step > 4 ? 'completed' : 'disabled'}`}>
            <div className="step-header">
              <span className="step-number">Step 4</span>
              <h3>Preview</h3>
            </div>
            {step === 4 ? (
              <div className="preview-container">
                <div className="certificate-mockup">
                  <div className="cert-title">Certificate Preview</div>
                  <div className="cert-name">Daniel Kombou</div>
                  <div className="cert-course">Software Engineering</div>
                  <div className="cert-date">August 2, 2026</div>
                </div>
                <div className="recipients-count">
                  <span>Recipients: <strong>150</strong></span>
                </div>
                <button
                  className="primary-btn generate-btn"
                  onClick={handleGenerateCertificates}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating Certificates...' : 'Generate Certificates'}
                </button>
              </div>
            ) : (
              <div className="step-summary">
                <span>✨ Preview verified (150 recipients)</span>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="step-card success-card active">
            <div className="success-icon">✅</div>
            <h2>Done!</h2>
            <p className="success-subtitle">150 certificates successfully generated and ready for download.</p>
            
            <div className="download-actions">
              <button className="primary-btn download-btn" onClick={() => alert('Downloading ZIP of all certificates...')}>
                📥 Download ZIP
              </button>
              <button className="secondary-btn download-btn" onClick={() => alert('Downloading individual PDFs folder...')}>
                📄 Download Individual PDFs
              </button>
            </div>

            <button className="text-btn reset-btn" onClick={resetAll}>
              🔄 Generate Another Batch
            </button>
          </div>
        )}
      </section>

      {/* Footer spacer */}
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} CertiGen. All rights reserved.</p>
      </footer>
    </div>
  )
}
