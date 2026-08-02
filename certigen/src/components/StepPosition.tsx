interface StepPositionProps {
  step: number
  columns: string[]
  nameColumn: string
  setNameColumn: (col: string) => void
  textPositions: { name: { x: number; y: number; fontSize: number } }
  setTextPositions: (pos: { name: { x: number; y: number; fontSize: number } }) => void
  onNext: () => void
  onEdit: () => void
}

export function StepPosition({
  step,
  columns,
  nameColumn,
  setNameColumn,
  textPositions,
  setTextPositions,
  onNext,
  onEdit,
}: StepPositionProps) {
  if (step < 3) return null

  return (
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

          <div className="p-4 bg-gray-50 dark:bg-[#16171d] rounded-xl border border-gray-200 dark:border-[#2e303a] flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-[#08060d] dark:text-[#f3f4f6]">Name Vertical Position ({textPositions.name.y}%)</h4>
            <input 
              type="range" 
              min="20" 
              max="80" 
              value={textPositions.name.y} 
              onChange={e => setTextPositions({ name: { ...textPositions.name, y: Number(e.target.value) } })} 
              className="w-full" 
            />
          </div>

          <button className="primary-btn step-next-btn px-6 py-3 bg-[#08060d] dark:bg-[#f3f4f6] text-white dark:text-[#08060d] font-semibold rounded-lg self-end hover:opacity-90 transition-all" onClick={onNext}>
            Continue to Preview →
          </button>
        </div>
      ) : (
        <div className="step-summary flex justify-between items-center text-sm font-medium text-[#08060d] dark:text-[#f3f4f6]">
          <span>Name Column: {nameColumn}</span>
          <button className="edit-step-btn px-3 py-1 border border-gray-300 dark:border-[#2e303a] rounded text-xs font-semibold hover:border-[#08060d]" onClick={onEdit}>Edit</button>
        </div>
      )}
    </div>
  )
}
