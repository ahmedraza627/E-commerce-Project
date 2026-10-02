/** URL-safe slug with a short random suffix to keep slugs unique. */
export const slugify = (text) => {
  const base = String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
};
