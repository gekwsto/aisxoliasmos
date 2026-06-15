import OpenAI from 'openai';
import { logOpenAIUsage } from '@/lib/monitoring/events';

let _client: OpenAI | undefined;

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

export interface ArticleInput {
  id: string;
  title: string;
  excerpt: string | null;
}

export interface ArticleScore {
  id: string;
  viralScore: number;
  discussionScore: number;
  businessValueScore: number;
  searchPotentialScore: number;
  controversyScore: number;
  facebookDiscussionScore: number;
  overallScore: number;
  whyThisMatters: string;
  bestFacebookAngle: string;
  reasoning: string;
}

const BATCH_SIZE = 15;
const SCORING_MODEL = 'gpt-4o';

function slog(step: string, data?: unknown) {
  console.log(`[scoring] ${step}`, data ?? '');
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

// ── Fallback parser ────────────────────────────────────────────────────────
// Handles every known response format the AI might use instead of the canonical one.
// Maps results back to the original article list by:
//   1. Numeric index ("1", "2", 1, 2)  — primary
//   2. Full/partial title match         — fallback
//   3. Array position                   — last resort

function extractScore(item: Record<string, unknown>): number {
  const candidates = [
    item.overallScore, item.overall_score,
    item.importanceScore, item.importance_score,
    item.score, item.totalScore, item.total_score,
    item.finalScore, item.final_score,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (!isNaN(n) && n > 0) return n;
  }
  // Compute from sub-scores if overallScore is missing
  const viral = Number(item.viralScore ?? item.viral_score ?? 0);
  const disc = Number(item.discussionScore ?? item.discussion_score ?? 0);
  const biz = Number(item.businessValueScore ?? item.business_value_score ?? 0);
  const seo = Number(item.searchPotentialScore ?? item.search_potential_score ?? 0);
  if (viral + disc + biz + seo > 0) {
    return Math.round(viral * 0.30 + disc * 0.25 + biz * 0.25 + seo * 0.20);
  }
  return 0;
}

function extractArray(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    for (const key of ['scores', 'results', 'articles', 'items', 'data']) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
    // Single object wrapped in a container — try first array-valued key
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) return val as Record<string, unknown>[];
    }
  }
  return [];
}

function normalizeToHundred(raw: number): number {
  if (raw <= 1 && raw > 0) return clamp(raw * 100);
  if (raw <= 10) return clamp(raw * 10);
  return clamp(raw);
}

function mapResultsToArticles(
  rawArr: Record<string, unknown>[],
  articles: ArticleInput[],
  formatTag: string
): { scores: ArticleScore[]; fallbackUsed: string | null } {
  if (rawArr.length === 0) return { scores: [], fallbackUsed: null };

  const scores: ArticleScore[] = [];
  let fallbackUsed: string | null = null;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const idxStr = String(i + 1);

    // Strategy 1: match by numeric index ID
    let match = rawArr.find((r) => {
      const rid = String(r.id ?? r.idx ?? r.index ?? '');
      return rid === idxStr || rid === String(i);
    });

    // Strategy 2: match by title (partial, case-insensitive)
    if (!match) {
      const titleLower = article.title.toLowerCase().slice(0, 40);
      match = rawArr.find((r) => {
        const t = String(r.title ?? r.headline ?? '').toLowerCase();
        return t.includes(titleLower) || titleLower.includes(t.slice(0, 30));
      });
      if (match) fallbackUsed = `title-match (${formatTag})`;
    }

    // Strategy 3: positional fallback
    if (!match && i < rawArr.length) {
      match = rawArr[i];
      fallbackUsed = `positional (${formatTag})`;
    }

    if (!match) continue;

    const raw = extractScore(match);
    const normalized = normalizeToHundred(raw);

    scores.push({
      id: article.id,
      viralScore: normalizeToHundred(Number(match.viralScore ?? match.viral_score ?? 0)),
      discussionScore: normalizeToHundred(Number(match.discussionScore ?? match.discussion_score ?? 0)),
      businessValueScore: normalizeToHundred(Number(match.businessValueScore ?? match.business_value_score ?? 0)),
      searchPotentialScore: normalizeToHundred(Number(match.searchPotentialScore ?? match.search_potential_score ?? 0)),
      controversyScore: normalizeToHundred(Number(match.controversyScore ?? match.controversy_score ?? 0)),
      facebookDiscussionScore: normalizeToHundred(Number(match.facebookDiscussionScore ?? match.facebook_discussion_score ?? 0)),
      overallScore: normalized,
      whyThisMatters: String(match.whyThisMatters ?? match.why_this_matters ?? match.insight ?? ''),
      bestFacebookAngle: String(match.bestFacebookAngle ?? match.best_facebook_angle ?? match.angle ?? ''),
      reasoning: String(match.reasoning ?? match.reason ?? match.explanation ?? ''),
    });
  }

  return { scores, fallbackUsed };
}

// ── Main export ────────────────────────────────────────────────────────────

export async function scoreArticles(articles: ArticleInput[]): Promise<ArticleScore[]> {
  if (articles.length === 0) return [];
  const client = getClient();
  const results: ArticleScore[] = [];
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchResults = await scoreBatch(client, batch);
    results.push(...batchResults);
  }
  return results;
}

async function scoreBatch(client: OpenAI, articles: ArticleInput[]): Promise<ArticleScore[]> {
  // Use simple 1-based numeric IDs — never full URLs — to avoid AI truncation bugs
  const list = articles
    .map(
      (a, i) =>
        `${i + 1}. ID:${i + 1}\nΤίτλος: ${a.title}\nΠερίληψη: ${(a.excerpt ?? '').slice(0, 200) || '(κενή)'}`
    )
    .join('\n\n');

  const systemPrompt = `Είσαι Editorial Director για το ελληνικό news portal ΑΙΣΧΟΛΙΑΣΜΟΣ. Αξιολογείς άρθρα για δημοσίευση με στόχο το Facebook engagement.

Για κάθε άρθρο δίνεις βαθμολογία 0-100 στις εξής διαστάσεις:

viralScore — Πιθανότητα viral στα social media
• 0-39: ρουτίνα  40-69: κάποιο ενδιαφέρον  70-100: υψηλό viral potential

discussionScore — Πιθανότητα engagement και σχολίων
• 0-39: μονόπλευρη  40-69: κάποιο debate  70-100: έντονη αντιπαράθεση

businessValueScore — Αξία για επιχειρηματικό/επαγγελματικό κοινό
• 0-39: lifestyle  40-69: γενικό  70-100: υψηλή επαγγελματική αξία

searchPotentialScore — SEO και organic traffic
• 0-39: εφήμερη είδηση  40-69: κάποιο SEO  70-100: evergreen ή high-volume keywords

controversyScore — Πιθανότητα polarization
• 0-39: ουδέτερο  40-69: μέτρια τριβή  70-100: έντονη πόλωση

facebookDiscussionScore — Πόσο πιθανό να γράψει κάποιος σχόλιο στο Facebook
• 0-39: ελάχιστα σχόλια  40-69: κάποιο discussion  70-100: γεμάτο σχόλια

overallScore — υπολόγισε ακριβώς: round(viralScore*0.30 + discussionScore*0.25 + businessValueScore*0.25 + searchPotentialScore*0.20)

whyThisMatters — μία πρόταση editorial insight (ή "" αν ρουτίνα)
bestFacebookAngle — μία αντιπαραθετική ερώτηση (ή "" αν δεν υπάρχει)
reasoning — 1 σύντομη πρόταση: αξίζει ή όχι να γίνει άρθρο

ΚΡΙΤΙΚΟ: Επέστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ έγκυρο JSON. Το πεδίο "id" πρέπει να είναι ακριβώς ο αριθμός που δίνεται (1, 2, 3...).

Παράδειγμα:
{"scores":[{"id":"1","viralScore":72,"discussionScore":65,"businessValueScore":80,"searchPotentialScore":55,"controversyScore":60,"facebookDiscussionScore":70,"overallScore":69,"whyThisMatters":"...","bestFacebookAngle":"...","reasoning":"..."}]}`;

  slog('scoring_api_called', {
    model: SCORING_MODEL,
    items: articles.length,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    ids: articles.map((_, i) => String(i + 1)),
  });

  let rawContent: string | null = null;

  try {
    const response = await client.chat.completions.create({
      model: SCORING_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Αξιολόγησε τα παρακάτω ${articles.length} άρθρα:\n\n${list}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 3500,
    });

    void logOpenAIUsage({
      service: 'scoring',
      model: SCORING_MODEL,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      operation: `Batch Scoring (${articles.length} articles)`,
    });

    rawContent = response.choices[0]?.message?.content ?? null;

    slog('scoring_response_received', {
      finishReason: response.choices[0]?.finish_reason,
      hasContent: Boolean(rawContent),
      contentLength: rawContent?.length ?? 0,
      preview: rawContent?.slice(0, 200),
    });

    if (!rawContent) {
      slog('scoring_parse_error', { reason: 'empty_content', model: SCORING_MODEL });
      return [];
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    slog('scoring_api_error', { error: msg, model: SCORING_MODEL });
    return [];
  }

  // ── Parse ────────────────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    slog('scoring_parse_error', {
      reason: 'json_parse_failed',
      error: err instanceof Error ? err.message : String(err),
      rawPreview: rawContent.slice(0, 300),
    });
    return [];
  }

  const rawArr = extractArray(parsed);
  slog('scoring_array_extracted', {
    arrayLength: rawArr.length,
    firstItemKeys: rawArr[0] ? Object.keys(rawArr[0]) : [],
    firstItemId: rawArr[0]?.id,
  });

  if (rawArr.length === 0) {
    slog('scoring_parse_error', {
      reason: 'no_array_found',
      parsedKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed as object) : typeof parsed,
      rawPreview: rawContent.slice(0, 300),
    });
    return [];
  }

  const { scores, fallbackUsed } = mapResultsToArticles(rawArr, articles, 'main');

  slog('scoring_parse_success', {
    parsedCount: rawArr.length,
    mappedCount: scores.length,
    fallbackUsed,
    overallScores: scores.map((s) => ({ id: s.id.slice(-20), overall: s.overallScore })),
  });

  if (fallbackUsed) {
    slog('fallback_used', { strategy: fallbackUsed });
  }

  slog('parsed_scores_count', { count: scores.length, ofRequested: articles.length });

  return scores;
}
