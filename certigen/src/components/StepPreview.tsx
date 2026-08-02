interface StepPreviewProps {
  step: number
  templatePreviewUrl: string
  recipients: { name: string }[]
  isGenerating: boolean
  generationProgress: number
  onGenerate: () => void
}

export function StepPreview({
  step,
  templatePreviewUrl,
  recipients,
  isGenerating,
  generationProgress,
  onGenerate,
}: StepPreviewProps) {
  if (step < 4) return null

  return (
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
            Total Names Ready: <strong className="text-[#aa3bff]">{recipients.length}</strong>
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
            onClick={onGenerate}
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
  )
}
