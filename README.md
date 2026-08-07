# Gradio Pipeline Hub

> A live, automatically updated directory of open-source, fully-working **Gradio pipelines** for audio, video, and document tasks. Every tool is **deployable to Hugging Face with just an API key** — no local Python, no GPU setup, no `git clone`.

The visual style matches the **music-transcription-monitor** dashboard. The interaction pattern (card grid + left sidebar filters + detail modal + copyable deploy command) follows **mcp.so/agents**.

- **Live site:** [https://kajica2.github.io/gradio-pipeline-hub/](https://kajica2.github.io/gradio-pipeline-hub/)
- **Tester pipeline:** [https://kajica2.github.io/gradio-pipeline-hub/tester.html](https://kajica2.github.io/gradio-pipeline-hub/tester.html) (browser-only audio transcription, no server)
- **Reference Gradio app:** [`public/gradio-app/`](./public/gradio-app/) (deploy this to your own HF Space)

---

## What's in here

| Path | What it is |
| --- | --- |
| `index.html` | Main directory (Vite + React) — cards, sidebar, modal, search |
| `tester.html` | Browser-only Solo Transcription Tester (Web Audio + ACF2+) |
| `tester.js` | Vanilla JS pitch detection engine (the same algorithm as the reference tester) |
| `src/App.jsx` | Main React app with URL state, search, filters, sort |
| `src/components/` | `ToolCard`, `Sidebar`, `ToolModal`, `Toast` |
| `src/lib/github.js` | GitHub API client (REST, with a 30-minute cache) |
| `src/lib/categorize.js` | Auto-categorize any repo from its name/description/topics |
| `src/data/categories.json` | 20 categories, each with a colour and keyword list |
| `src/data/featured.json` | 23 hand-picked tools (see "Adding tools" below) |
| `public/gradio-app/app.py` | Working Gradio music-transcription app (Basic Pitch) |
| `public/gradio-app/requirements.txt` | Pinned deps for the Gradio app |
| `public/gradio-app/README.md` | HF Space README (front-matter is the Space config) |

## Quick start

```bash
# Install
npm install

# Dev (http://localhost:5173)
npm run dev

# Build to dist/
npm run build

# Preview the built output
npm run preview
```

## Deploy

### GitHub Pages
The repo is configured for `gh-pages` deployment out of the box. After `npm run build`:

```bash
npx gh-pages -d dist
```

(or just `npm run deploy:gh` once you add a remote named `origin`)

### Vercel / Netlify
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+

## Customizing categories

Open `src/data/categories.json`. Each category is:

```json
{
  "id": "music-transcription",
  "label": "Music Transcription",
  "color": "#7dd3c0",
  "keywords": ["transcription", "midi", "musicxml", "pitch", "basic-pitch", "crepe"]
}
```

- **`id`** — used in URL query string (`?cat=music-transcription`)
- **`label`** — sidebar text
- **`color`** — the gradient tint for cards in that category
- **`keywords`** — auto-matcher. Any repo whose name/description/topics contains one of these (case-insensitive) gets bucketed into the category if it doesn't have an explicit one.

Add or remove categories freely. The sidebar rebuilds from this file at build time.

## Adding tools (hand-picked)

The featured list lives in `src/data/featured.json`. Each tool looks like:

```json
{
  "id": "basic-pitch",
  "owner": "spotify",
  "repo": "basic-pitch",
  "category": "music-transcription",
  "description": "A lightweight CNN+GRU model for monophonic/polyphonic note transcription…",
  "language": "Python",
  "topics": ["audio", "transcription", "midi"],
  "gradioSpace": "spotify/basic-pitch",
  "deployable": true,
  "notes": "Works on CPU. ~1s for a 30s clip."
}
```

- **`gradioSpace`** — if the tool already has an HF Space, link it here. It shows up as a button in the modal.
- **`deployable`** — whether the `gradio deploy` one-liner is expected to work. (Most things that have a `requirements.txt` and a `app.py` are.)

To add a new tool, append to the `tools` array. GitHub metadata (stars, language, topics, license) is fetched at runtime from the public API — no need to keep it in sync.

## Submit-a-tool flow

The "Submit" button in the header links to a GitHub issue template. The simplest setup:

1. Add `.github/ISSUE_TEMPLATE/tool-submission.yml` to the deployed repo.
2. In the URL the header button points to, swap to your repo: `https://github.com/<owner>/<repo>/issues/new?template=tool-submission.yml`.

The current build uses a generic "new issue" link. Swap it for a one-time setup.

## Deploying a tool to your own Hugging Face Space

Every card in the directory has a "Deploy" button. Clicking it opens the modal with a copyable command:

```bash
gradio deploy \
  --token YOUR_HF_TOKEN \
  --repo https://github.com/owner/repo
```

**What this does:** it asks Gradio to upload the repo to a new HF Space under your account, using your write token. You'll get a URL like `https://huggingface.co/spaces/your-name/your-tool` in under two minutes.

**Prerequisites:**
- `pip install gradio`
- A HF token with **write** scope from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
- The repo must contain an `app.py` with a `gr.Interface` or `gr.Blocks` at module level (which is what every Gradio tool here has).

If the repo you want to deploy doesn't ship with an `app.py`, you can also do this:

1. Click **Create new Space** in the modal → HF gives you a new repo.
2. Copy `public/gradio-app/app.py`, `requirements.txt`, and the README into the new repo.
3. Push. The Space will boot automatically.

## How the directory updates

The `featured.json` is committed and version-controlled. The Hub renders that list immediately, then enriches each card with live GitHub data (stars, language, topics, last push, license) by calling the public REST API.

- 30-minute in-memory cache, so refreshing the page doesn't hammer the API.
- If the GitHub call fails, the card still renders with whatever was in `featured.json` — never empty.
- The search bar is **fuzzy across name + description + topics** (case-insensitive substring).

## The Tester pipeline

`tester.html` is a fully working browser-only audio transcription demo. It does the same thing the Python `app.py` does, but with Web Audio + ACF2+ autocorrelation instead of Basic Pitch.

Use it to:
- Verify your audio file plays in the browser.
- See what monophonic pitch detection looks like.
- Get a sense of what the deployed Gradio app will produce.

The tester has zero dependencies — no Python, no model download, no network calls. Drop it on any static host.

## File-by-file map

```
gradio-hub/
├── index.html                       Vite entry
├── tester.html                      Standalone tester page
├── vite.config.js                   base: './' for relative-asset GH Pages deploy
├── tailwind.config.js               Theme tokens match src/styles.css
├── package.json
├── postcss.config.js
├── src/
│   ├── main.jsx                     React mount + theme init
│   ├── App.jsx                      Main app (sidebar, search, modal, grid)
│   ├── styles.css                   Design system (matches music-transcription-monitor)
│   ├── components/
│   │   ├── ToolCard.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ToolModal.jsx            README preview + copyable deploy command
│   │   └── Toast.jsx
│   ├── lib/
│   │   ├── github.js                GitHub API client + cache + HF Space discovery
│   │   ├── categorize.js            Auto-categorize repos by keywords
│   │   ├── match.js                 Markdown→HTML for README preview
│   │   ├── url.js                   URL state round-tripping
│   │   └── theme.js                 Dark/light toggle, persisted to localStorage
│   └── data/
│       ├── categories.json          20 categories
│       └── featured.json            23 hand-picked tools
├── tester.js                        Vanilla JS pitch detection engine
└── public/
    └── gradio-app/                  Working reference Gradio app
        ├── app.py
        ├── requirements.txt
        └── README.md                (front-matter is the HF Space config)
```

## License

MIT. Built on the back of [Gradio](https://gradio.app), [Hugging Face Spaces](https://huggingface.co/docs/hub/spaces), and the music-transcription-monitor design system.
