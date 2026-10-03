import { formatCertificateName } from '../nameFormat'

interface StepPreviewProps {
  step: number
  templatePreviewUrl: string
  templateDims: { width: number; height: number } | null
  recipients: { name: string; [key: string]: string }[]
  nameColumn: string
  textPositions: { name: { x: number; y: number; fontSize: number } }
  nameFormatOpts: { fullNamesCount: number; abbreviationsCount: number }
  nameColor: string
  isGenerating: boolean
  generationProgress: number
  onGenerate: () => void
}

export function StepPreview({
  step,
  templatePreviewUrl,
  templateDims,
  recipients,
  nameColumn,
  textPositions,
  nameFormatOpts,
  nameColor,
  isGenerating,
  generationProgress,
  onGenerate,
}: StepPreviewProps) {
  if (step < 4) return null

  const aspectRatio = templateDims
    ? templateDims.width / templateDims.height
    : 1.414

  const rawSample = recipients[0]
    ? (recipients[0][nameColumn] || recipients[0].name || 'Daniel Kombou')
    : 'Daniel Kombou'

  const previewName = formatCertificateName(rawSample, nameFormatOpts)
  const previewFontSize = Math.max(16, textPositions.name.fontSize * 0.75)

  // jsPDF anchors text at its baseline; measure the font metrics so the preview
  // can place the baseline at the same y% instead of centering the text box.
  const serifStack = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
  let baselineOffset = previewFontSize * 0.8
  const ctx = document.createElement('canvas').getContext('2d')
  if (ctx) {
    ctx.font = `bold ${previewFontSize}px ${serifStack}`
    const metrics = ctx.measureText(previewName)
    const ascent = metrics.fontBoundingBoxAscent || previewFontSize * 0.8
    const descent = metrics.fontBoundingBoxDescent || previewFontSize * 0.2
    baselineOffset = (previewFontSize + ascent - descent) / 2
  }

  return (
    <div className={`step-card p-6 lg:p-8 rounded-2xl border transition-all ${step === 4 ? 'border-[#aa3bff]/50 shadow-xl bg-white dark:bg-[#1f2028]' : step > 4 ? 'border-gray-200 dark:border-[#2e303a] bg-gray-50 dark:bg-[#1f2028]/50' : 'opacity-40 pointer-events-none'}`}>
      <div className="step-header flex items-center gap-4 mb-4">
        <span className="step-number px-3 py-1 bg-[#aa3bff]/10 text-[#aa3bff] font-mono text-sm font-bold rounded-md border border-[#aa3bff]/30">Step 4</span>
        <h3 className="text-xl font-semibold text-[#08060d] dark:text-[#f3f4f6]">Certificate Preview & Generation</h3>
      </div>
      {step === 4 ? (
        <div className="preview-container flex flex-col items-center gap-6">
          <div 
            className="certificate-mockup relative w-full max-w-xl bg-white border-2 border-gray-300 rounded-xl shadow-2xl overflow-hidden"
            style={{
              aspectRatio: `${aspectRatio} / 1`,
              backgroundImage: templatePreviewUrl ? `url(${templatePreviewUrl})` : undefined,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {!templatePreviewUrl && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center p-6 border-4 border-[#aa3bff]">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Default Certificate Template</span>
                <span className="text-sm text-gray-400">Upload a custom template in Step 1 to use your design</span>
              </div>
            )}
            {/* Dynamic Name Overlay: baseline anchored at y%, matching jsPDF */}
            <div 
              className="absolute w-full text-center pointer-events-none"
              style={{
                left: `${textPositions.name.x}%`,
                top: `${textPositions.name.y}%`,
                transform: 'translate(-50%, 0)',
              }}
            >
              <span 
                className="font-serif font-bold drop-shadow-sm inline-block px-2"
                style={{
                  fontSize: `${previewFontSize}px`,
                  lineHeight: 1,
                  color: nameColor,
                  transform: `translateY(${-baselineOffset}px)`,
                }}
              >
                {previewName}
              </span>
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
