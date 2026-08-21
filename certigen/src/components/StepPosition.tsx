interface StepPositionProps {
  step: number
  columns: string[]
  nameColumn: string
  setNameColumn: (col: string) => void
  textPositions: { name: { x: number; y: number; fontSize: number } }
  setTextPositions: (pos: { name: { x: number; y: number; fontSize: number } }) => void
  nameFormatOpts: { fullNamesCount: number; abbreviationsCount: number }
  setNameFormatOpts: (opts: { fullNamesCount: number; abbreviationsCount: number }) => void
  nameColor: string
  setNameColor: (color: string) => void
  onNext: () => void
  onEdit: () => void
}

const COLOR_SWATCHES = [
  { label: 'Navy', value: '#1f2847' },
  { label: 'Purple', value: '#aa3bff' },
  { label: 'Black', value: '#08060d' },
  { label: 'Crimson', value: '#991b1b' },
  { label: 'Blue', value: '#1e3a8a' },
  { label: 'Green', value: '#166534' },
  { label: 'Amber', value: '#d97706' },
]

export function StepPosition({
  step,
  columns,
  nameColumn,
  setNameColumn,
  textPositions,
  setTextPositions,
  nameFormatOpts,
  setNameFormatOpts,
  nameColor,
  setNameColor,
  onNext,
  onEdit,
}: StepPositionProps) {
  if (step < 3) return null

  return (
    <div className={`step-card p-6 lg:p-8 rounded-2xl border transition-all ${step === 3 ? 'border-[#aa3bff]/50 shadow-xl bg-white dark:bg-[#1f2028]' : step > 3 ? 'border-gray-200 dark:border-[#2e303a] bg-gray-50 dark:bg-[#1f2028]/50' : 'opacity-40 pointer-events-none'}`}>
      <div className="step-header flex items-center gap-4 mb-4">
        <span className="step-number px-3 py-1 bg-[#aa3bff]/10 text-[#aa3bff] font-mono text-sm font-bold rounded-md border border-[#aa3bff]/30">Step 3</span>
        <h3 className="text-xl font-semibold text-[#08060d] dark:text-[#f3f4f6]">Map Name Column, Format & Style</h3>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-[#16171d] rounded-lg border border-gray-200 dark:border-[#2e303a] flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Full Names to Appear</label>
              <select
                value={nameFormatOpts.fullNamesCount}
                onChange={(e) => setNameFormatOpts({ ...nameFormatOpts, fullNamesCount: Number(e.target.value) })}
                className="p-2 rounded border border-gray-300 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] text-sm text-[#08060d] dark:text-[#f3f4f6]"
              >
                <option value={1}>1 Full Name</option>
                <option value={2}>2 Full Names (Default)</option>
                <option value={3}>3 Full Names</option>
                <option value={999}>All Full Names</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#16171d] rounded-lg border border-gray-200 dark:border-[#2e303a] flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Abbreviations / Initials</label>
              <select
                value={nameFormatOpts.abbreviationsCount}
                onChange={(e) => setNameFormatOpts({ ...nameFormatOpts, abbreviationsCount: Number(e.target.value) })}
                className="p-2 rounded border border-gray-300 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] text-sm text-[#08060d] dark:text-[#f3f4f6]"
              >
                <option value={0}>0 (None)</option>
                <option value={1}>1 Abbreviation</option>
                <option value={2}>2 Abbreviations</option>
                <option value={999}>All Remaining as Abbreviations</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#16171d] rounded-lg border border-gray-200 dark:border-[#2e303a] flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase text-gray-500">Name Color Code</label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={nameColor}
                onChange={(e) => setNameColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300 dark:border-[#2e303a] bg-transparent p-1"
                title="Choose color"
              />
              <input
                type="text"
                value={nameColor}
                onChange={(e) => setNameColor(e.target.value)}
                placeholder="#1f2847"
                className="p-2 rounded border border-gray-300 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] text-sm text-[#08060d] dark:text-[#f3f4f6] font-mono w-32"
              />
              <div className="flex items-center gap-2 flex-wrap ml-auto">
                {COLOR_SWATCHES.map(sw => (
                  <button
                    key={sw.value}
                    type="button"
                    onClick={() => setNameColor(sw.value)}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: sw.value }}
                    title={sw.label}
                  />
                ))}
              </div>
            </div>
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
          <span>Name Column: {nameColumn} | Color: {nameColor}</span>
          <button className="edit-step-btn px-3 py-1 border border-gray-300 dark:border-[#2e303a] rounded text-xs font-semibold hover:border-[#08060d]" onClick={onEdit}>Edit</button>
        </div>
      )}
    </div>
  )
}
