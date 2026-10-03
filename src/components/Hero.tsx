interface HeroProps {
  onStart: () => void
}

export function Hero({ onStart }: HeroProps) {
  return (
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
      <button 
        className="primary-btn hero-cta px-8 py-4 bg-[#aa3bff] hover:bg-[#9328ee] text-white font-semibold text-lg rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5" 
        onClick={onStart}
      >
        Start Generating
      </button>
    </section>
  )
}
