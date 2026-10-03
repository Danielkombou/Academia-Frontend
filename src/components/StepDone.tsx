interface StepDoneProps {
  step: number
  recipientCount: number
  generatedPdfs: { name: string; blob: Blob }[]
  onDownloadZip: () => void
  onDownloadSingle: (pdf: { name: string; blob: Blob }) => void
  onReset: () => void
}

export function StepDone({
  step,
  recipientCount,
  generatedPdfs,
  onDownloadZip,
  onDownloadSingle,
  onReset,
}: StepDoneProps) {
  if (step !== 5) return null

  return (
    <div className="step-card success-card active p-8 rounded-2xl border border-[#aa3bff] bg-white dark:bg-[#1f2028] text-center flex flex-col items-center gap-6 shadow-2xl">
      <div className="success-icon text-5xl">✅</div>
      <div>
        <h2 className="text-2xl font-bold text-[#08060d] dark:text-[#f3f4f6] mb-2">Done!</h2>
        <p className="success-subtitle text-gray-600 dark:text-gray-400">{recipientCount} certificates successfully generated as standalone PDFs and zipped.</p>
      </div>
      
      <div className="download-actions flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button className="primary-btn download-btn flex-1 py-4 px-6 bg-[#aa3bff] hover:bg-[#9328ee] text-white font-semibold rounded-xl shadow-md transition-all" onClick={onDownloadZip}>
          📥 Download ZIP Archive
        </button>
        <button className="secondary-btn download-btn flex-1 py-4 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-[#08060d] dark:text-[#f3f4f6] font-semibold rounded-xl border border-gray-300 dark:border-gray-700 transition-all" onClick={() => onDownloadSingle(generatedPdfs[0])}>
          📄 Download Sample PDF ({generatedPdfs[0]?.name || 'Certificate.pdf'})
        </button>
      </div>

      <button className="text-btn reset-btn text-[#aa3bff] font-semibold hover:underline mt-2" onClick={onReset}>
        🔄 Generate Another Batch
      </button>
    </div>
  )
}
