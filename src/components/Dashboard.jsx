import React from 'react';
import {
  CheckCircle2, Circle, Sparkles, FileText, Github, FlaskConical,
  Bot, Database, BarChart3, GraduationCap, Play, FolderGit2,
  Lightbulb, ListChecks, ExternalLink, ArrowUpRight, Quote
} from 'lucide-react';
import dashboard from '../data/dashboard.json';

function StatusPill({ status }) {
  const map = {
    today: { label: 'Today', cls: 'pill--ok' },
    next: { label: 'Next', cls: 'pill--warn' },
    backlog: { label: 'Backlog', cls: 'pill--pending' },
  };
  const s = map[status] || { label: status, cls: 'pill--pending' };
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

function SectionHead({ eyebrow, title, subtitle, meta }) {
  return (
    <div className="dash-section-head">
      <div>
        <p className="section-eyebrow">{eyebrow}</p>
        <h2 className="dash-section-title">{title}</h2>
        {subtitle && <p className="dash-section-sub">{subtitle}</p>}
      </div>
      {meta && <p className="section-meta">{meta}</p>}
    </div>
  );
}

function TodaySection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="01 / Today"
        title="Today's Focus"
        subtitle={`${data.date} · week ${data.week} · ${data.headline}`}
        meta={`${data.items.length} items`}
      />
      <div className="dash-actions">
        <h3 className="dash-actions__title">📋 Next Actions</h3>
        <ol className="dash-actions__list">
          {data.items.map((it, i) => (
            <li key={it.id} className="dash-actions__item">
              <span className="dash-actions__marker">{i + 1}</span>
              <div className="dash-actions__body">
                <div className="dash-actions__top">
                  <strong>{it.label}</strong>
                  <StatusPill status={it.status} />
                </div>
                <p className="dash-actions__why">
                  <span className="dim">{it.why}</span>
                </p>
                <div className="dash-actions__foot">
                  <span className="dash-actions__time">⏱ {it.time}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PapersSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="02 / Weekly"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} papers`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((p) => (
          <a key={p.id} className="paper-card" href={p.url} target="_blank" rel="noopener">
            <div className="paper-card__head">
              <div className="paper-card__head-main">
                <p className="paper-card__step">{p.venue}</p>
                <h3 className="paper-card__title">{p.title}</h3>
                <p className="paper-card__authors">{p.authors}</p>
              </div>
              <ArrowUpRight size={14} className="paper-card__arrow" />
            </div>
            <p className="paper-card__summary">{p.summary}</p>
            <div className="paper-card__tags">
              {p.tags.map((t) => (
                <span key={t} className="paper-tag">#{t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function TrendingSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="03 / Weekly"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} repos`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((r) => (
          <a key={`${r.owner}/${r.repo}`} className="trending-card" href={r.url} target="_blank" rel="noopener">
            <div className="trending-card__top">
              <div className="trending-card__name">
                <span className="trending-card__owner">{r.owner}</span>
                <span className="trending-card__slash">/</span>
                <span className="trending-card__repo">{r.repo}</span>
              </div>
              <ArrowUpRight size={14} className="trending-card__arrow" />
            </div>
            <p className="trending-card__summary">{r.summary}</p>
            <div className="trending-card__foot">
              <span className="trending-card__stars">⭐ {r.stars}</span>
              <span className="trending-card__delta">{r.delta}</span>
              <span className="trending-card__cat">{r.category}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function ResearchGroupsSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="04 / Org"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} groups`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((g) => (
          <a key={g.name} className="group-card" href={g.url} target="_blank" rel="noopener">
            <div className="group-card__head">
              <h3 className="group-card__name">{g.name}</h3>
              <ArrowUpRight size={14} />
            </div>
            <p className="group-card__focus">{g.focus}</p>
            <div className="group-card__row">
              <span className="group-card__label">Location</span>
              <span className="group-card__value">{g.city}</span>
            </div>
            <div className="group-card__row">
              <span className="group-card__label">Latest</span>
              <span className="group-card__value">{g.recent}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function AgentFrameworksSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="05 / Orchestration"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} frameworks`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((a) => (
          <a key={a.name} className="agent-card" href={a.url} target="_blank" rel="noopener">
            <div className="agent-card__head">
              <h3 className="agent-card__name">{a.name}</h3>
              <ArrowUpRight size={14} />
            </div>
            <p className="agent-card__summary">{a.summary}</p>
            <div className="agent-card__foot">
              {a.stack.map((s) => (
                <span key={s} className="agent-stack">{s}</span>
              ))}
              {a.deployable && <span className="pill pill--ok">deployable</span>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function DatasetsSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="06 / Foundation"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} datasets`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((d) => (
          <a key={d.name} className="dataset-card" href={d.url} target="_blank" rel="noopener">
            <div className="dataset-card__head">
              <h3 className="dataset-card__name">{d.name}</h3>
              <span className="dataset-card__license">{d.license}</span>
            </div>
            <p className="dataset-card__size">{d.size}</p>
            <div className="dataset-card__use">
              <span className="dataset-card__label">Use:</span> {d.use}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function BenchmarksSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="07 / Eval"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} benchmarks`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((b) => (
          <a key={b.name} className="bench-card" href={b.url} target="_blank" rel="noopener">
            <div className="bench-card__head">
              <h3 className="bench-card__name">{b.name}</h3>
              <ArrowUpRight size={14} />
            </div>
            <div className="bench-card__metric">
              <span className="bench-card__label">Metric</span>
              <span className="bench-card__value">{b.metric}</span>
            </div>
            <div className="bench-card__metric">
              <span className="bench-card__label">Current leader</span>
              <span className="bench-card__value bench-card__value--lead">🥇 {b.leader}</span>
            </div>
            <p className="bench-card__summary">{b.summary}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function TutorialsSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="08 / Learn"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} tutorials`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((t) => (
          <a key={t.title} className="tutorial-card" href={t.url} target={t.url.startsWith('http') ? '_blank' : undefined} rel="noopener">
            <div className="tutorial-card__head">
              <div className="tutorial-card__step">
                <GraduationCap size={12} />
                <span>{t.level}</span>
              </div>
              <h3 className="tutorial-card__title">{t.title}</h3>
            </div>
            <p className="tutorial-card__summary">{t.summary}</p>
            <div className="tutorial-card__foot">
              <span>⏱ {t.time}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function VideosSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="09 / Watch"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} videos`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((v) => (
          <a key={v.title} className="video-card" href={v.url} target="_blank" rel="noopener">
            <div className="video-card__play">
              <Play size={20} fill="currentColor" />
            </div>
            <h3 className="video-card__title">{v.title}</h3>
            <p className="video-card__meta">{v.channel} · {v.length}</p>
            <p className="video-card__summary">{v.summary}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function YourProjectsSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="10 / Mine"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} repos`}
      />
      <div className="dash-grid dash-grid--2">
        {data.items.map((p) => {
          const status = p.status;
          const pillCls = status === 'live' ? 'pill--ok' : status === 'shipped' ? 'pill--ok' : 'pill--warn';
          return (
            <a key={p.name} className="project-card" href={p.url} target={p.url.startsWith('http') && !p.url.startsWith('#') ? '_blank' : undefined} rel="noopener">
              <div className="project-card__head">
                <FolderGit2 size={16} />
                <h3 className="project-card__name">{p.name}</h3>
                <span className={`pill ${pillCls}`}>{status}</span>
              </div>
              <p className="project-card__summary">{p.summary}</p>
              <div className="project-card__foot">
                <span>Last activity: {p.last}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function IdeasSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="11 / Capture"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.length} ideas`}
      />
      <div className="ideas-list">
        {data.items.map((i) => (
          <div key={i.id} className="idea-item">
            <div className="idea-item__left">
              <span className="idea-tag idea-tag--{i.tag}">#{i.tag}</span>
            </div>
            <p className="idea-item__text">{i.text}</p>
            <div className="idea-item__right">
              <span className="idea-vote">▲ {i.votes}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChecklistSection({ data }) {
  return (
    <section className="dash-section">
      <SectionHead
        eyebrow="12 / Pre-flight"
        title={data.title}
        subtitle={data.subtitle}
        meta={`${data.items.filter(i => i.checked).length}/${data.items.length} done`}
      />
      <ul className="checklist">
        {data.items.map((c, i) => (
          <li key={i} className={`checklist__item ${c.checked ? 'checklist__item--done' : ''}`}>
            {c.checked
              ? <CheckCircle2 size={16} className="checklist__icon checklist__icon--on" />
              : <Circle size={16} className="checklist__icon" />}
            <span className="checklist__label">{c.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Dashboard() {
  return (
    <div className="dash-root">
      <TodaySection data={dashboard.today} />
      <PapersSection data={dashboard.papers} />
      <TrendingSection data={dashboard.trending} />
      <ResearchGroupsSection data={dashboard.research_groups} />
      <AgentFrameworksSection data={dashboard.agent_frameworks} />
      <DatasetsSection data={dashboard.datasets} />
      <BenchmarksSection data={dashboard.benchmarks} />
      <TutorialsSection data={dashboard.tutorials} />
      <VideosSection data={dashboard.videos} />
      <YourProjectsSection data={dashboard.your_projects} />
      <IdeasSection data={dashboard.ideas_inbox} />
      <ChecklistSection data={dashboard.checklist} />
    </div>
  );
}
