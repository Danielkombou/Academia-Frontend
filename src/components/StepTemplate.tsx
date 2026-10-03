interface StepTemplateProps {
  step: number
  templateFile: File | null
  onTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNext: () => void
  onEdit: () => void
}

export function StepTemplate({ step, templateFile, onTemplateUpload, onNext, onEdit }: StepTemplateProps) {
  if (step < 1) return null

  return (
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
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={onTemplateUpload}
            className="hidden"
          />
          <label htmlFor="template-upload" className="dropzone-label w-full border-2 border-dashed border-gray-300 dark:border-[#2e303a] rounded-xl p-6 sm:p-10 text-center cursor-pointer hover:border-[#aa3bff] hover:bg-[#aa3bff]/5 transition-all">
            <div className="dropzone-icon text-4xl mb-3">📄</div>
            <p className="text-base font-medium text-[#08060d] dark:text-[#f3f4f6]"><strong>Drop your PNG / JPG / PDF template here</strong> or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Recommended landscape 2970x2100px · PDF first page is used</p>
            {templateFile && <span className="file-selected inline-block mt-3 text-sm text-[#aa3bff] font-semibold">Selected: {templateFile.name}</span>}
          </label>
          {templateFile && (
            <button className="primary-btn step-next-btn px-6 py-3 bg-[#08060d] dark:bg-[#f3f4f6] text-white dark:text-[#08060d] font-semibold rounded-lg self-end hover:opacity-90 transition-all" onClick={onNext}>
              Continue to Step 2 →
            </button>
          )}
        </div>
      ) : (
        <div className="step-summary flex justify-between items-center text-sm font-medium text-[#08060d] dark:text-[#f3f4f6]">
          <span className="flex items-center gap-2">📄 {templateFile?.name || 'template.png'}</span>
          <button className="edit-step-btn px-3 py-1 border border-gray-300 dark:border-[#2e303a] rounded text-xs font-semibold hover:border-[#08060d]" onClick={onEdit}>Change</button>
        </div>
      )}
    </div>
  )
}
