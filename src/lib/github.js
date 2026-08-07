// GitHub API helpers — uses the public REST API.
// We fetch only the fields we need to keep the response small.
// For each tool, we also try to discover a Hugging Face Space link from
// the repo description / homepage / topics.

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const cache = new Map();
const inflight = new Map();

function cacheKey(key) {
  return `gh:${key}`;
}

function getFromCache(key) {
  const hit = cache.get(cacheKey(key));
  if (!hit) return null;
  if (Date.now() - hit.t > CACHE_TTL_MS) {
    cache.delete(cacheKey(key));
    return null;
  }
  return hit.v;
}

function setCache(key, value) {
  cache.set(cacheKey(key), { t: Date.now(), v: value });
}

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: ${path}`);
  }
  return res.json();
}

export async function fetchRepoMeta(owner, repo) {
  const key = `${owner}/${repo}`;
  const cached = getFromCache(key);
  if (cached) return cached;
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    const data = await ghFetch(`/repos/${owner}/${repo}`);
    return {
      owner: data.owner.login,
      repo: data.name,
      name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      topics: data.topics || [],
      pushedAt: data.pushed_at,
      updatedAt: data.updated_at,
      license: data.license ? data.license.spdx_id : null,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      homepage: data.homepage,
      htmlUrl: data.html_url,
      avatarUrl: data.owner.avatar_url,
    };
  })();

  inflight.set(key, promise);
  try {
    const v = await promise;
    setCache(key, v);
    return v;
  } finally {
    inflight.delete(key);
  }
}

export async function fetchReadme(owner, repo) {
  const key = `readme:${owner}/${repo}`;
  const cached = getFromCache(key);
  if (cached) return cached;

  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/readme`);
    if (data.content && data.encoding === 'base64') {
      // Decode base64 to UTF-8 (handle multi-byte)
      const binary = atob(data.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const text = new TextDecoder('utf-8').decode(bytes);
      setCache(key, text);
      return text;
    }
  } catch (e) {
    /* README not found */
  }
  return null;
}

// Try to discover a Hugging Face Space URL from a description or homepage
export function discoverHfSpace(meta) {
  if (!meta) return null;
  const haystack = [meta.homepage, meta.description, meta.htmlUrl]
    .filter(Boolean)
    .join(' ');
  const m = haystack.match(/huggingface\.co\/spaces\/([\w-]+\/[\w-]+)/i);
  if (m) return `https://huggingface.co/spaces/${m[1]}`;
  return null;
}
