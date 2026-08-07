import React from 'react';
import { Check } from 'lucide-react';

export default function Sidebar({ categories, counts, selected, onToggle, sort, onSortChange }) {
  return (
    <aside className="sidebar" aria-label="Filters">
      <div className="sidebar__group">
        <p className="sidebar__label">
          Categories
          <span className="sidebar__count">
            {selected.length || 'all'} selected
          </span>
        </p>
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              className="cat-pill"
              aria-pressed={isSelected}
              onClick={() => onToggle(cat.id)}
            >
              <span className="cat-pill__dot" style={{ background: cat.color }} />
              <span className="cat-pill__check">
                {isSelected && <Check size={10} strokeWidth={3} />}
              </span>
              <span className="cat-pill__label">{cat.label}</span>
              <span className="cat-pill__num">{counts[cat.id] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar__group">
        <p className="sidebar__label">Sort by</p>
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="stars">Stars</option>
          <option value="updated">Recently updated</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      <div className="sidebar__group">
        <p className="sidebar__label">About</p>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', margin: 0, lineHeight: 1.5 }}>
          Every tool here deploys to <strong style={{ color: 'var(--accent)' }}>Hugging Face Spaces</strong> with one command. No local Python. No GPU setup. Just a HF token.
        </p>
        <a
          href="./tester.html"
          style={{
            display: 'inline-block',
            marginTop: 'var(--s-2)',
            padding: '6px 10px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-dim)',
            textDecoration: 'none',
            background: 'var(--surface)',
          }}
        >
          → Try the Solo Transcription Tester
        </a>
      </div>
    </aside>
  );
}
