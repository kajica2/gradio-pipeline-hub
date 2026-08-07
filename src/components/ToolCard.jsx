import React from 'react';
import { Star, ExternalLink, Rocket, GitBranch } from 'lucide-react';
import { categorizeTool, getCategory, languageColor } from '../lib/categorize.js';

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ToolCard({ tool, onOpen }) {
  const cat = tool.category
    ? getCategory(tool.category)
    : categorizeTool(tool);
  const color = cat ? cat.color : '#5b5f70';
  const displayName = tool.repo || tool.name.split('/')[1] || tool.name;
  const owner = tool.owner || tool.name.split('/')[0];

  return (
    <button className="tool-card" onClick={() => onOpen(tool)} aria-label={`Open ${tool.name}`}>
      <div className="tool-card__thumb">
        <div
          className="tool-card__thumb-bg"
          style={{
            background: `linear-gradient(135deg, ${color}33 0%, ${color}11 50%, var(--surface) 100%)`,
          }}
        />
        <div className="tool-card__thumb-grid" />
        <div className="tool-card__thumb-name">
          {displayName.charAt(0).toUpperCase()}
        </div>
        {cat && (
          <div className="tool-card__thumb-tag" style={{ color }}>
            {cat.label}
          </div>
        )}
      </div>
      <div className="tool-card__body">
        <h3 className="tool-card__name">
          {displayName}
          <span className="tool-card__name-slash">/ {owner}</span>
        </h3>
        <p className="tool-card__desc">{tool.description || '—'}</p>
        <div className="tool-card__meta">
          {tool.stars !== undefined && (
            <span className="tool-card__stat" title={`${tool.stars} stars`}>
              <Star size={11} fill="currentColor" strokeWidth={0} />
              {formatCount(tool.stars)}
            </span>
          )}
          {tool.language && (
            <span className="tool-card__stat" title={tool.language}>
              <span
                className="tool-card__lang-dot"
                style={{ background: languageColor(tool.language) }}
              />
              {tool.language}
            </span>
          )}
          {tool.pushedAt && (
            <span className="tool-card__stat" title={tool.pushedAt}>
              <GitBranch size={11} />
              {timeAgo(tool.pushedAt)}
            </span>
          )}
        </div>
        {tool.topics && tool.topics.length > 0 && (
          <div className="tool-card__topics">
            {tool.topics.slice(0, 3).map((t) => (
              <span key={t} className="tool-card__topic">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="tool-card__actions">
        <span
          className="tool-card__deploy"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(tool, { deploy: true });
          }}
        >
          <Rocket size={11} /> Deploy
        </span>
        {tool.htmlUrl && (
          <a
            className="tool-card__gh"
            href={tool.htmlUrl}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            title="Open on GitHub"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </button>
  );
}

function formatCount(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}
