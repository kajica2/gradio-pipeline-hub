# Gradio Pipeline Directory

A modern, mcp.so-style web directory for discovering open-source **Gradio pipelines** that handle audio / video / multimodal tasks — and instantly deploying any of them to **Hugging Face Spaces** with a single command. Zero local setup. No Python. No GPU configuration.

> The site is **static** (vanilla HTML/CSS/JS) so it deploys for free on GitHub Pages, Vercel, Netlify, or any static host.

---

## What's in the box

```
gradio-pipeline-directory/
├── index.html              ← Main directory (card grid, sidebar filters, modal)
├── tester.html             ← Tester: connect to any deployed HF Space
├── data/
│   ├── featured.json       ← Hand-picked, verified Gradio repos (the seed)
│   └── categories.json     ← Sidebar categories + sort options
├── shared/
│   ├── styles.css          ← Theme, layout, cards, modal
│   └── app.js              ← Filter / sort / modal / search logic
└── README.md
```

---

## Run it locally

No build step. Just serve the directory.

```bash
cd gradio-pipeline-directory
python3 -m http.server 5173
# → http://localhost:5173
```

Or with Node:

```bash
npx serve . -p 5173
```

Then open `http://localhost:5173` (directory) and `http://localhost:5173/tester.html` (tester).

---

## Deploy it

### GitHub Pages (recommended for `kajica2.github.io`)

1. Push to a GitHub repo.
2. Repo → Settings → Pages → Source: `main` / root.
3. Your site is live at `https://<user>.github.io/<repo>/` (or `https://<user>.github.io/` if the repo is `<user>.github.io`).

### Vercel / Netlify

Drag-and-drop the folder into [vercel.com/new](https://vercel.com/new). Done.

### Custom domain

Point a CNAME to your hosting target and set the `url` field in the deploy provider.

---

## Customize

### Add / remove categories

Edit `data/categories.json`:

```json
{
  "categories": [
    { "id": "audio-transcription", "label": "Audio Transcription", "icon": "🎙️", "color": "#7dd3c0" },
    { "id": "text-to-speech",      "label": "Text-to-Speech",      "icon": "🗣️", "color": "#60a5fa" }
    // add more, remove freely — IDs must be unique
  ],
  "sortOptions": [
    { "id": "stars",    "label": "Most stars" },
    { "id": "updated",  "label": "Recently updated" },
    { "id": "name",     "label": "Name (A–Z)" },
    { "id": "category", "label": "Category" }
  ]
}
```

The directory automatically re-renders the sidebar.

### Add a new tool to the directory

Edit `data/featured.json` and add a new entry under `tools`:

```json
{
  "id": "my-cool-tool",
  "owner": "your-org",
  "repo": "your-repo",
  "name": "My Cool Tool",
  "description": "One-paragraph description shown on the card and in the modal.",
  "category": "audio-transcription",      // must match an ID in categories.json
  "language": "Python",
  "topics": ["asr", "speech"],
  "gradioFile": "app.py",                  // path inside the repo (default: app.py)
  "gradioPath": "/",                       // Gradio path within the app
  "homepage": "https://example.com",
  "spaceUrl": "https://huggingface.co/spaces/owner/name",  // optional
  "license": "MIT",
  "minGpu": false,
  "notes": "Free-form notes shown in the modal."
}
```

**Validation checklist before you ship:**
- The GitHub repo returns 200 (`curl -I https://github.com/<owner>/<repo>`)
- The repo has an `app.py` (or whatever you specify in `gradioFile`) at the path you point to
- If you link a `spaceUrl`, the Space URL returns 200 (private/gated Spaces return 401 — that's fine, still a real Space)
- The category ID in `featured.json` matches an ID in `categories.json`

### "Submit a tool" button

The Submit button in the header opens a prefilled GitHub issue:

```
https://github.com/<your-org>/gradio-pipeline-directory/issues/new?template=submit-tool.md
```

Add `.github/ISSUE_TEMPLATE/submit-tool.md` to your repo so the form is pre-populated with the right fields.

---

## The deploy command

Every tool modal shows:

```bash
gradio deploy --token YOUR_HF_TOKEN --repo https://github.com/OWNER/REPO
```

What this does:
1. Clones the repo.
2. Detects the Gradio app (looks for `app.py` by default, or whatever you pass via `--app-file`).
3. Creates a new Hugging Face Space under your account.
4. Pushes the code, sets up a Python SDK Space, installs requirements, and boots the app.

**Get a token:** <https://huggingface.co/settings/tokens> (needs **Write** access).

**Install the CLI:** `pip install gradio` (the deploy command is bundled with the Gradio library).

**If the app needs a custom file path:**

```bash
gradio deploy --token YOUR_HF_TOKEN \
  --repo https://github.com/Stability-AI/generative-models \
  --app-file demo/code/scripts/demo_svd.py
```

The modal shows this automatically when the tool's `gradioFile` is not `app.py`.

---

## Architecture notes

- **No build step.** Pure HTML + ES2020 JS. Tailwind-style utility classes are not used; everything is custom CSS using design tokens. This keeps the project portable and easy to fork.
- **JSON-driven.** Categories and tools live in JSON files. Add a tool = edit `featured.json`.
- **Live star enrichment.** On load, the directory hits the GitHub API (no auth, 60 req/hr) for the first 6 tools to fetch real star counts and last-pushed timestamps. Results are cached in `sessionStorage` so the second visit is instant. If a tool already has a non-zero `stars` value in `featured.json`, it won't be re-fetched.
- **URL state.** Every filter, search, and sort is reflected in the query string, so any view is shareable and the browser back/forward works.
- **No backend.** A serverless function would let you cache GitHub responses across users and proxy the (sometimes CORS-restricted) HF API. For v1, the direct client-side approach is simpler and works for ≤60 req/hr per visitor.

---

## Tester (`tester.html`)

The tester page lets you connect to **any** deployed HF Space via the official `@gradio/client` (loaded from esm.sh). It:
1. Connects and reads the Gradio config.
2. Lists every API endpoint (`api_name`) with input counts and types.
3. Generates a form for the selected endpoint.
4. Fires a real request and shows the response.

Try it with `openai/whisper`, `suno/bark`, or any of the quick-pick chips.

---

## License

MIT. Tools listed in `featured.json` retain their own licenses — check each repo's `LICENSE` file before commercial use. Several tools in the seed list (Coqui XTTS, Stable Video Diffusion) have non-commercial clauses; the `license` field in each entry calls this out.

---

## Credits

- UI / layout inspired by [mcp.so/agents](https://mcp.so/agents).
- Theme / CSS variables built on top of the [music-transcription-monitor](https://kajica2.github.io/music-transcription-monitor/) design system.
- Deploy integration powered by [Gradio](https://gradio.app) and [Hugging Face Spaces](https://huggingface.co/spaces).
