export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractHeadings(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]) as 2 | 3;
    const id = match[2];
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    if (id && text) headings.push({ id, text, level });
  }
  return headings;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sͰ-Ͽἀ-῿-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function addHeadingIds(html: string): string {
  const used = new Map<string, number>();
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi, (_, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const base = slugify(text) || `heading`;
    const count = used.get(base) ?? 0;
    const id = count === 0 ? base : `${base}-${count}`;
    used.set(base, count + 1);
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}
