import React from 'react'

interface StepNamesProps {
  step: number
  spreadsheetFile: File | null
  recipientCount: number
  onSpreadsheetUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNext: () => void
  onEdit: () => void
}

export function StepNames({ step, spreadsheetFile, recipientCount, onSpreadsheetUpload, onNext, onEdit }: StepNamesProps) {
  if (step < 2) return null

  return (
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
            accept=".csv,.txt,.docx"
            onChange={onSpreadsheetUpload}
            className="hidden"
          />
          <label htmlFor="spreadsheet-upload" className="dropzone-label w-full border-2 border-dashed border-gray-300 dark:border-[#2e303a] rounded-xl p-6 sm:p-10 text-center cursor-pointer hover:border-[#aa3bff] hover:bg-[#aa3bff]/5 transition-all">
            <div className="dropzone-icon text-4xl mb-3">📊</div>
            <p className="text-base font-medium text-[#08060d] dark:text-[#f3f4f6]"><strong>Drop your names list here</strong> (CSV, TXT or DOCX — one name per line)</p>
            <p className="text-xs text-gray-400 mt-1">Loaded with {recipientCount} demo recipients (or upload your own)</p>
            {spreadsheetFile && <span className="file-selected inline-block mt-3 text-sm text-[#aa3bff] font-semibold">Selected: {spreadsheetFile.name}</span>}
          </label>
          <div className="flex justify-between w-full mt-2">
            <span className="text-xs text-gray-500">{recipientCount} names loaded</span>
            <button className="primary-btn step-next-btn px-6 py-3 bg-[#08060d] dark:bg-[#f3f4f6] text-white dark:text-[#08060d] font-semibold rounded-lg hover:opacity-90 transition-all" onClick={onNext}>
              Continue to Step 3 →
            </button>
          </div>
        </div>
      ) : (
        <div className="step-summary flex justify-between items-center text-sm font-medium text-[#08060d] dark:text-[#f3f4f6]">
          <span>📊 {spreadsheetFile?.name || 'names.csv'} ({recipientCount} names)</span>
          <button className="edit-step-btn px-3 py-1 border border-gray-300 dark:border-[#2e303a] rounded text-xs font-semibold hover:border-[#08060d]" onClick={onEdit}>Change</button>
        </div>
      )}
    </div>
  )
}
