export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-wrap">
      <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="search"
        className="search-input"
        placeholder="Rechercher un produit (bœuf, agneau, volaille…)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <style>{`
        .search-wrap {
          position: relative;
          margin-bottom: 12px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 13px 16px 13px 42px;
          border-radius: 10px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          font-size: 14px;
          font-family: var(--font-body);
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: var(--shadow);
        }
        .search-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(74, 79, 84, 0.1);
        }
        .search-input::placeholder { color: var(--color-text-muted); }
      `}</style>
    </div>
  )
}
