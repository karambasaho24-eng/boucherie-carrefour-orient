export default function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="category-filter">
      <button
        className={`chip ${active === 'all' ? 'chip-active' : ''}`}
        onClick={() => onChange('all')}
      >
        🥩 Tout voir
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`chip ${active === cat ? 'chip-active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}

      <style>{`
        .category-filter {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0 16px;
          scrollbar-width: none;
        }
        .category-filter::-webkit-scrollbar { display: none; }
        .chip {
          flex-shrink: 0;
          padding: 9px 18px;
          border-radius: 999px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-muted);
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .chip:hover:not(.chip-active) {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background: rgba(74, 79, 84,0.04);
        }
        .chip-active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #fff;
          box-shadow: 0 3px 10px rgba(74, 79, 84,0.3);
        }
      `}</style>
    </div>
  )
}
