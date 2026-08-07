// URL state helpers — keep filters in the query string so deep links work

export function readFiltersFromUrl(defaults = {}) {
  const params = new URLSearchParams(window.location.search);
  const out = { ...defaults };
  if (params.has('q')) out.q = params.get('q');
  if (params.has('cat')) out.cats = params.get('cat').split(',').filter(Boolean);
  if (params.has('sort')) out.sort = params.get('sort');
  return out;
}

export function writeFiltersToUrl(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.cats && filters.cats.length) params.set('cat', filters.cats.join(','));
  if (filters.sort && filters.sort !== 'stars') params.set('sort', filters.sort);
  const next = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  window.history.replaceState(null, '', next);
}
