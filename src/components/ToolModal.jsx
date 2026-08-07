import React, { useEffect, useState } from 'react';
import { X, Star, GitBranch, AlertCircle, ExternalLink, Rocket, Copy } from 'lucide-react';
import { fetchReadme, discoverHfSpace } from '../lib/github.js';
import { markdownToHtml } from '../lib/match.js';
import { categorizeTool, getCategory, languageColor } from '../lib/categorize.js';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

export default function ToolModal({ tool, onClose, onCopy, onDeploy }) {
  const [readme, setReadme] = useState(null);
  const [readmeLoading, setReadmeLoading] = useState(true);

  useEffect(() => {
    if (!tool) return;
    setReadme(null);
    setReadmeLoading(true);
    fetchReadme(tool.owner, tool.repo)
      .then((md) => {
        setReadme(md);
        setReadmeLoading(false);
      })
      .catch(() => setReadmeLoading(false));
  }, [tool]);

  useEffect(() => {
    if (!tool) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [tool, onClose]);

  if (!tool) return null;

  const cat = tool.category ? getCategory(tool.category) : categorizeTool(tool);
  const color = cat ? cat.color : '#5b5f70';
  const hfSpace = tool.gradioSpace ? `https://huggingface.co/spaces/${tool.gradioSpace}` : discoverHfSpace(tool);

  const deployCmd = `gradio deploy \\\n  --token YOUR_HF_TOKEN \\\n  --repo https://github.com/${tool.owner}/${tool.repo}`;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__head-main">
            <div
              className="brand__mark"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                width: 48,
                height: 48,
                fontSize: 22,
              }}
              aria-hidden="true"
            >
              {(tool.repo || tool.name).charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 className="modal__title">
                {tool.repo || tool.name.split('/')[1]}
                <span className="modal__title-slash"> / {tool.owner}</span>
              </h2>
              <p className="modal__subtitle">
                {cat ? cat.label : 'Uncategorized'} ·{' '}
                {tool.language || '—'}
                {tool.license ? ` · ${tool.license}` : ''}
              </p>
            </div>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__section">
            <h3>About</h3>
            <p>{tool.description || 'No description provided.'}</p>
            {tool.notes && (
              <p style={{ marginTop: 'var(--s-2)', fontStyle: 'italic', color: 'var(--text-faint)' }}>
                {tool.notes}
              </p>
            )}
          </div>

          <div className="modal__section">
            <h3>One-click deploy</h3>
            <div className="modal__deploy">
              <p className="modal__deploy-hint" style={{ marginBottom: 'var(--s-2)' }}>
                Run this in any directory. <code style={{ color: 'var(--accent)' }}>YOUR_HF_TOKEN</code> is highlighted — click to copy.
              </p>
              <div className="modal__deploy-cmd">
                {deployCmd.split('\n').map((line, i) => (
                  <div key={i} style={{ display: 'block' }}>
                    {line.split(/(YOUR_HF_TOKEN)/g).map((part, j) =>
                      part === 'YOUR_HF_TOKEN' ? (
                        <span
                          key={j}
                          className="token"
                          onClick={() => onCopy('YOUR_HF_TOKEN')}
                          title="Click to copy"
                        >
                          YOUR_HF_TOKEN
                        </span>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                ))}
              </div>
              <p className="modal__deploy-hint" style={{ marginTop: 'var(--s-3)' }}>
                Get your token at{' '}
                <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener">
                  huggingface.co/settings/tokens
                </a>{' '}
                (write access needed).
              </p>
              <div style={{ display: 'flex', gap: 'var(--s-2)', marginTop: 'var(--s-3)' }}>
                <button
                  className="btn btn--primary"
                  onClick={() => onDeploy(tool)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Rocket size={13} /> Copy full command
                </button>
                <a
                  className="btn"
                  href="https://huggingface.co/docs/hub/spaces-sdks-gradio"
                  target="_blank"
                  rel="noopener"
                >
                  <ExternalLink size={13} /> Docs
                </a>
              </div>
            </div>
          </div>

          <div className="modal__section">
            <h3>Stats</h3>
            <div className="modal__stats">
              <div className="modal__stat">
                <p className="modal__stat-label">Stars</p>
                <p className="modal__stat-value">
                  <Star size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                  {tool.stars !== undefined ? tool.stars.toLocaleString() : '—'}
                </p>
              </div>
              <div className="modal__stat">
                <p className="modal__stat-label">Forks</p>
                <p className="modal__stat-value">
                  <GitBranch size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                  {tool.forks !== undefined ? tool.forks.toLocaleString() : '—'}
                </p>
              </div>
              <div className="modal__stat">
                <p className="modal__stat-label">Open issues</p>
                <p className="modal__stat-value">
                  <AlertCircle size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                  {tool.openIssues !== undefined ? tool.openIssues.toLocaleString() : '—'}
                </p>
              </div>
              <div className="modal__stat">
                <p className="modal__stat-label">Last push</p>
                <p className="modal__stat-value">{formatDate(tool.pushedAt)}</p>
              </div>
            </div>
          </div>

          {tool.topics && tool.topics.length > 0 && (
            <div className="modal__section">
              <h3>Topics</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tool.topics.map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: '3px 8px',
                      background: 'var(--code-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="modal__section">
            <h3>README preview</h3>
            <div className="modal__readme">
              {readmeLoading && (
                <p style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Loading…</p>
              )}
              {!readmeLoading && readme && (
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(readme) }} />
              )}
              {!readmeLoading && !readme && (
                <p style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
                  No README found. Check the GitHub link below.
                </p>
              )}
            </div>
          </div>

          <div className="modal__section">
            <h3>Links</h3>
            <div className="modal__links">
              <a
                className="modal__link"
                href={tool.htmlUrl}
                target="_blank"
                rel="noopener"
              >
                <ExternalLink size={12} /> GitHub repo
              </a>
              {hfSpace && (
                <a
                  className="modal__link"
                  href={hfSpace}
                  target="_blank"
                  rel="noopener"
                >
                  <ExternalLink size={12} /> HF Space
                </a>
              )}
              {tool.homepage && (
                <a
                  className="modal__link"
                  href={tool.homepage}
                  target="_blank"
                  rel="noopener"
                >
                  <ExternalLink size={12} /> Homepage
                </a>
              )}
              <a
                className="modal__link"
                href={`https://huggingface.co/new-space?template=${hfSpace || ''}`}
                target="_blank"
                rel="noopener"
              >
                <Rocket size={12} /> Create new Space
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
