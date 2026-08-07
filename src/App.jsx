import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Sun, Moon, Github, Plus, LayoutGrid, Activity } from 'lucide-react';
import ToolCard from './components/ToolCard.jsx';
import ToolModal from './components/ToolModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import Dashboard from './components/Dashboard.jsx';
import { fetchRepoMeta } from './lib/github.js';
import { readFiltersFromUrl, writeFiltersToUrl } from './lib/url.js';
import { categorizeTool, getCategory } from './lib/categorize.js';
import { toggleTheme, getCurrentTheme } from './lib/theme.js';
import categoriesData from './data/categories.json';
import featuredData from './data/featured.json';

const SORTS = {
  stars: (a, b) => (b.stars || 0) - (a.stars || 0),
  updated: (a, b) => new Date(b.pushedAt || 0) - new Date(a.pushedAt || 0),
  name: (a, b) => (a.repo || a.name).localeCompare(b.repo || b.name),
};

const TABS = [
  { id: 'hub', label: 'Hub', href: '#hub' },
  { id: 'tools', label: 'Tools', href: '#tools' },
];

export default function App() {
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'hub';
    const h = window.location.hash;
    if (h === '#tools') return 'tools';
    return 'hub';
  });
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => readFiltersFromUrl({ sort: 'stars' }));
  const [openTool, setOpenTool] = useState(null);
  const [toast, setToast] = useState('');
  const [_, forceRender] = useState(0);

  // Hash-based tab routing
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h === '#tools') setTab('tools');
      else if (h === '#hub') setTab('hub');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleTab = (id) => {
    setTab(id);
    if (typeof window !== 'undefined') {
      window.location.hash = id;
    }
  };

  // Persist filters to URL
  useEffect(() => {
    writeFiltersToUrl(filters);
  }, [filters]);

  // Theme reactive update
  useEffect(() => {
    forceRender((n) => n + 1);
  }, []);

  // Load featured + GitHub metadata
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const merged = featuredData.tools.map((t) => ({
        ...t,
        name: `${t.owner}/${t.repo}`,
        stars: 0,
        forks: 0,
        openIssues: 0,
        language: t.language,
        topics: t.topics,
        description: t.description,
        htmlUrl: `https://github.com/${t.owner}/${t.repo}`,
      }));
      setTools(merged);
      setLoading(false);

      for (const t of merged) {
        try {
          const meta = await fetchRepoMeta(t.owner, t.repo);
          if (cancelled) return;
          setTools((cur) =>
            cur.map((c) => (c.id === t.id ? { ...c, ...meta } : c))
          );
        } catch (e) {
          /* leave fallback */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = filters.q?.toLowerCase().trim() || '';
    const cats = filters.cats || [];
    return tools
      .filter((t) => {
        if (cats.length) {
          const cat = t.category ? getCategory(t.category) : categorizeTool(t);
          if (!cat || !cats.includes(cat.id)) return false;
        }
        if (q) {
          const hay = [
            t.owner,
            t.repo,
            t.name,
            t.description || '',
            ...(t.topics || []),
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort(SORTS[filters.sort] || SORTS.stars);
  }, [tools, filters]);

  const counts = useMemo(() => {
    const c = {};
    for (const t of tools) {
      const cat = t.category ? getCategory(t.category) : categorizeTool(t);
      if (cat) c[cat.id] = (c[cat.id] || 0) + 1;
    }
    return c;
  }, [tools]);

  const handleToggleCategory = useCallback((id) => {
    setFilters((f) => {
      const cur = f.cats || [];
      const next = cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id];
      return { ...f, cats: next };
    });
  }, []);

  const handleSortChange = (s) => setFilters((f) => ({ ...f, sort: s }));
  const handleSearchChange = (e) => setFilters((f) => ({ ...f, q: e.target.value }));

  const showToast = useCallback((msg) => setToast(msg), []);

  const handleCopy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      } catch (e) {
        showToast('Copy failed — try selecting manually');
      }
    },
    [showToast]
  );

  const handleDeploy = useCallback(
    async (tool) => {
      const cmd = `gradio deploy --token YOUR_HF_TOKEN --repo https://github.com/${tool.owner}/${tool.repo}`;
      await handleCopy(cmd);
    },
    [handleCopy]
  );

  const handleClearFilters = () => {
    setFilters({ sort: filters.sort, q: '', cats: [] });
  };

  const theme = getCurrentTheme();
  const hasActiveFilters = filters.q || (filters.cats && filters.cats.length > 0);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="brand">
            <a href="#hub" onClick={() => handleTab('hub')} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', color: 'inherit', opacity: 1 }}>
              <div className="brand__mark" aria-hidden="true">G</div>
              <div className="brand__text">
                <h1>Gradio Pipeline Hub</h1>
                <p>One-click deploy · zero local setup</p>
              </div>
            </a>
          </div>
          <nav className="header-nav" aria-label="Primary">
            <a
              href="#hub"
              className={`header-nav__link ${tab === 'hub' ? 'is-active' : ''}`}
              onClick={() => handleTab('hub')}
            >
              <Activity size={13} /> Hub
            </a>
            <a
              href="#tools"
              className={`header-nav__link ${tab === 'tools' ? 'is-active' : ''}`}
              onClick={() => handleTab('tools')}
            >
              <LayoutGrid size={13} /> Tools
            </a>
            <a href="./tester.html" className="header-nav__link">Tester</a>
            <a href="./live.html" className="header-nav__link">Live</a>
          </nav>
          <div className="header-actions">
            {tab === 'tools' && (
              <div className="search" role="search">
                <Search size={14} className="search__icon" />
                <input
                  type="search"
                  placeholder="Search tools, categories, topics…"
                  value={filters.q || ''}
                  onChange={handleSearchChange}
                  aria-label="Search"
                />
              </div>
            )}
            <a
              className="btn"
              href="https://github.com/kajica2/gradio-pipeline-hub/issues/new?template=tool-submission.yml"
              target="_blank"
              rel="noopener"
              title="Submit a tool"
            >
              <Plus size={13} /> Submit
            </a>
            <a
              className="btn"
              href="https://github.com/kajica2/gradio-pipeline-hub"
              target="_blank"
              rel="noopener"
              title="View on GitHub"
            >
              <Github size={13} />
            </a>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <Moon className="theme-toggle__icon theme-toggle__icon--moon" />
              <Sun className="theme-toggle__icon theme-toggle__icon--sun" />
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {tab === 'hub' && <Dashboard />}

        {tab === 'tools' && (
          <div className="layout">
            <Sidebar
              categories={categoriesData.categories}
              counts={counts}
              selected={filters.cats || []}
              onToggle={handleToggleCategory}
              sort={filters.sort}
              onSortChange={handleSortChange}
            />

            <section>
              <div className="toolbar">
                <span className="toolbar__count">
                  {loading
                    ? 'Loading tools…'
                    : `${visible.length} of ${tools.length} tools`}
                </span>
                {hasActiveFilters && (
                  <div className="toolbar__filters">
                    {filters.q && (
                      <button
                        className="filter-chip"
                        onClick={() => setFilters((f) => ({ ...f, q: '' }))}
                      >
                        q: {filters.q} <span className="filter-chip__x">✕</span>
                      </button>
                    )}
                    {(filters.cats || []).map((id) => {
                      const cat = getCategory(id);
                      return (
                        <button
                          key={id}
                          className="filter-chip"
                          onClick={() => handleToggleCategory(id)}
                        >
                          {cat?.label || id} <span className="filter-chip__x">✕</span>
                        </button>
                      );
                    })}
                    <button className="btn btn--sm btn--ghost" onClick={handleClearFilters}>
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="empty">
                  <h3>No tools match your filters</h3>
                  <p>Try clearing filters or searching for a different term.</p>
                </div>
              ) : (
                <div className="grid">
                  {visible.map((t) => (
                    <ToolCard key={t.id} tool={t} onOpen={(tool) => setOpenTool(tool)} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <span>gradio-pipeline-hub</span>
        <span>
          <span className="dot">·</span>
          v0.2 · daily dashboard + tools
          <span className="dot">·</span>
          <a href="./tester.html">Tester</a>
          <span className="dot">·</span>
          <a href="./live.html">Live</a>
          <span className="dot">·</span>
          <a href="https://huggingface.co" target="_blank" rel="noopener">HF Spaces</a>
        </span>
      </footer>

      {openTool && (
        <ToolModal
          tool={openTool}
          onClose={() => setOpenTool(null)}
          onCopy={handleCopy}
          onDeploy={handleDeploy}
        />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
