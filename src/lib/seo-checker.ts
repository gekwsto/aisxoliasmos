export interface SeoIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  deduction: number;
}

export interface SeoCheckResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: SeoIssue[];
  passed: string[];
}

export interface ArticleForSeoCheck {
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags: string[];
  imageUrl?: string | null;
  generatedImageUrl?: string | null;
  readTime: number;
  slug: string;
}

function scoreGrade(score: number): SeoCheckResult['grade'] {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function countWords(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

export function computeSeoScore(article: ArticleForSeoCheck): SeoCheckResult {
  const issues: SeoIssue[] = [];
  const passed: string[] = [];
  let deductions = 0;

  // ── SEO Title (20 pts) ──────────────────────────────────────────────────────
  const effectiveTitle = article.seoTitle || article.title;
  if (!article.seoTitle) {
    issues.push({ field: 'seoTitle', message: 'SEO Title δεν έχει οριστεί — χρησιμοποιείται ο τίτλος', severity: 'warning', deduction: 5 });
    deductions += 5;
  } else if (effectiveTitle.length < 30) {
    issues.push({ field: 'seoTitle', message: `SEO Title πολύ κοντό (${effectiveTitle.length} χαρ. — ελάχιστο 30)`, severity: 'error', deduction: 15 });
    deductions += 15;
  } else if (effectiveTitle.length > 65) {
    issues.push({ field: 'seoTitle', message: `SEO Title πολύ μακρύ (${effectiveTitle.length} χαρ. — μέγιστο 65)`, severity: 'warning', deduction: 10 });
    deductions += 10;
  } else {
    passed.push(`SEO Title: ${effectiveTitle.length} χαρακτήρες (ιδανικό 30–65)`);
  }

  // ── Meta Description (20 pts) ──────────────────────────────────────────────
  const effectiveDesc = article.seoDescription || article.excerpt;
  if (!article.seoDescription) {
    issues.push({ field: 'seoDescription', message: 'Meta Description δεν έχει οριστεί — χρησιμοποιείται το excerpt', severity: 'warning', deduction: 5 });
    deductions += 5;
  } else if (effectiveDesc.length < 80) {
    issues.push({ field: 'seoDescription', message: `Meta Description πολύ κοντό (${effectiveDesc.length} χαρ. — ελάχιστο 80)`, severity: 'error', deduction: 15 });
    deductions += 15;
  } else if (effectiveDesc.length > 165) {
    issues.push({ field: 'seoDescription', message: `Meta Description πολύ μακρύ (${effectiveDesc.length} χαρ. — μέγιστο 165)`, severity: 'warning', deduction: 8 });
    deductions += 8;
  } else {
    passed.push(`Meta Description: ${effectiveDesc.length} χαρακτήρες (ιδανικό 80–165)`);
  }

  // ── Content Length (20 pts) ─────────────────────────────────────────────────
  const wordCount = countWords(article.content);
  if (wordCount < 200) {
    issues.push({ field: 'content', message: `Πολύ κοντό άρθρο (${wordCount} λέξεις — ελάχιστο 200)`, severity: 'error', deduction: 20 });
    deductions += 20;
  } else if (wordCount < 400) {
    issues.push({ field: 'content', message: `Σχετικά κοντό άρθρο (${wordCount} λέξεις — συνιστάται 400+)`, severity: 'warning', deduction: 10 });
    deductions += 10;
  } else {
    passed.push(`Μήκος: ${wordCount} λέξεις`);
  }

  // ── Headings Structure (15 pts) ─────────────────────────────────────────────
  const h2Count = (article.content.match(/<h2[^>]*>/gi) || []).length;
  if (h2Count === 0) {
    issues.push({ field: 'headings', message: 'Δεν υπάρχουν H2 subheadings — απαραίτητο για structure', severity: 'error', deduction: 15 });
    deductions += 15;
  } else {
    passed.push(`Headings: ${h2Count} H2 subheading(s)`);
  }

  // ── Featured Image (10 pts) ─────────────────────────────────────────────────
  const hasImage = !!(article.imageUrl || article.generatedImageUrl);
  if (!hasImage) {
    issues.push({ field: 'image', message: 'Δεν υπάρχει εικόνα — κρίσιμο για Google Discover & social sharing', severity: 'error', deduction: 10 });
    deductions += 10;
  } else {
    passed.push('Εικόνα: υπάρχει');
  }

  // ── Tags / Keywords (10 pts) ────────────────────────────────────────────────
  if (article.tags.length === 0) {
    issues.push({ field: 'tags', message: 'Δεν υπάρχουν tags — βοηθούν στο keyword targeting', severity: 'warning', deduction: 10 });
    deductions += 10;
  } else if (article.tags.length < 3) {
    issues.push({ field: 'tags', message: `Λίγα tags (${article.tags.length} — συνιστάται 3–6)`, severity: 'info', deduction: 5 });
    deductions += 5;
  } else {
    passed.push(`Tags: ${article.tags.slice(0, 4).join(', ')}${article.tags.length > 4 ? '...' : ''}`);
  }

  // ── Internal Links (5 pts) ──────────────────────────────────────────────────
  const internalLinks = (article.content.match(/href=["']\/(article|category)\//g) || []).length;
  if (internalLinks === 0) {
    issues.push({ field: 'internalLinks', message: 'Δεν υπάρχουν internal links — αυξάνουν το crawl depth', severity: 'info', deduction: 5 });
    deductions += 5;
  } else {
    passed.push(`Internal links: ${internalLinks}`);
  }

  const score = Math.max(0, Math.min(100, 100 - deductions));
  return { score, grade: scoreGrade(score), issues, passed };
}

export function gradeColor(grade: SeoCheckResult['grade']): string {
  const colors: Record<string, string> = { A: '#059669', B: '#0891b2', C: '#d97706', D: '#ea580c', F: '#dc2626' };
  return colors[grade] ?? '#64748b';
}
