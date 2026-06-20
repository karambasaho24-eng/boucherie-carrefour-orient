import { useEffect, useState } from 'react'

export default function DarkModeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      aria-label="Changer de thème"
    >
      {theme === 'light' ? '🌙' : '☀️'}
      <style>{`
        .theme-toggle {
          background: none;
          border: none;
          font-size: 18px;
          line-height: 1;
        }
      `}</style>
    </button>
  )
}
