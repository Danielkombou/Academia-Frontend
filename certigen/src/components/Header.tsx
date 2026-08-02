export function Header() {
  return (
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
  )
}
