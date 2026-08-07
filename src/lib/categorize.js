// Auto-categorize a GitHub repo using its name + description + topics + README.
// This is the engine that turns "owner/repo" into a category without manual labeling.

import categoriesData from '../data/categories.json';

const CATEGORIES = categoriesData.categories;

const LANG_COLORS = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#2b7489',
  Jupyter: '#DA5B0B',
  HTML: '#e34c26',
  Rust: '#dea584',
  Go: '#00ADD8',
  C: '#555555',
  'C++': '#f34b7d',
  Shell: '#89e051',
  Dockerfile: '#384d54',
};

export function languageColor(lang) {
  return LANG_COLORS[lang] || '#5b5f70';
}

export function categorizeTool(tool) {
  // If the tool has a category already, use it
  if (tool.category) {
    return CATEGORIES.find((c) => c.id === tool.category) || null;
  }
  // Otherwise match against keywords
  const haystack = [
    tool.name,
    tool.repo,
    tool.description || '',
    ...(tool.topics || []),
  ]
    .join(' ')
    .toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        score += kw.length > 5 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return bestScore > 0 ? best : null;
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function getCategoryColor(id) {
  const cat = getCategory(id);
  return cat ? cat.color : '#5b5f70';
}
