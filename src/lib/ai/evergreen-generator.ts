import OpenAI from 'openai';
import { logOpenAIUsage } from '@/lib/monitoring/events';
import {
  GeneratedEvergreenSchema,
  evergreenWordCountMap,
  type GeneratedEvergreen,
  type EvergreenArticleType,
  type EvergreenLength,
} from './evergreen-schemas';

let _client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export interface EvergreenGenerateOptions {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  categoryName: string;
  targetLength: EvergreenLength;
  articleType: EvergreenArticleType;
  estimatedDifficulty: number;
  generateFaq: boolean;
  generateInternalLinks: boolean;
  generateSocialPosts: boolean;
  generateImagePrompt: boolean;
}

const articleTypeInstructions: Record<EvergreenArticleType, string> = {
  'what-is': 'Εξηγεί τι είναι το θέμα — ξεκινά με σαφή ορισμό, μετά λειτουργία και σημασία.',
  guide: 'Ολοκληρωμένος οδηγός Α-Ω. Κάθε H2 καλύπτει ένα βήμα ή βασική πτυχή.',
  comparison: 'Σύγκριση 2-4 επιλογών με κριτήρια, πλεονεκτήματα/μειονεκτήματα, τελική σύσταση.',
  tutorial: 'Αριθμημένα βήματα με <ol>. Κάθε βήμα: τίτλος, εξήγηση, παράδειγμα.',
  explainer: 'Εξηγεί πολύπλοκο θέμα απλά. Γιατί συμβαίνει, πώς λειτουργεί, τι σημαίνει.',
  'best-of': 'Αριθμημένη λίστα. Κάθε επιλογή: τίτλος, γιατί επιλέχθηκε, για ποιον ταιριάζει.',
  analysis: 'Ανάλυση με δεδομένα, τάσεις, σύγκριση. Τεκμηριωμένα συμπεράσματα και προβλέψεις.',
  faq: 'Δομημένο FAQ. 8-12 ερωτήσεις ως H2, κάθε μία με πλήρη απάντηση 100-200 λέξεων.',
};

export async function generateEvergreenContent(
  options: EvergreenGenerateOptions,
): Promise<GeneratedEvergreen> {
  const client = getClient();
  const wordCount = evergreenWordCountMap[options.targetLength];

  const systemPrompt = `Είσαι senior SEO content strategist και αρχισυντάκτης για το ελληνικό editorial portal ΑΙΣΧΟΛΙΑΣΜΟΣ.

Στόχος: EVERGREEN άρθρο που κατατάσσεται στη Google για μήνες — ΟΧΙ ειδησεογραφικό.

━━━ SEO ΚΑΝΟΝΕΣ (ΥΠΟΧΡΕΩΤΙΚΟΙ) ━━━

H1: Ακριβώς ΕΝΑΣ H1 — περιέχει ΠΑΝΤΑ την primary keyword
H2: 4-6 H2 ενότητες — κάθε H2 περιέχει related keyword ή LSI term
H3: Για υπο-ενότητες, breakdowns, παραδείγματα
Primary keyword: φυσική χρήση ~1-2% density — ΟΧΙ stuffing
Intro: Keyword εμφανίζεται στις πρώτες 100-150 λέξεις
Conclusion: Σαφές CTA ή answer to main question
Γλώσσα: ΠΑΝΤΑ στα Ελληνικά

━━━ ΡΗΤΑ ΑΠΑΓΟΡΕΥΜΕΝΕΣ ΦΡΑΣΕΙΣ ━━━

"υπογραμμίζει τη σημασία" • "αναδεικνύει τις προκλήσεις" • "ζωτικής σημασίας"
"κρίσιμο ορόσημο" • "σε αυτό το πλαίσιο" • "δεν είναι τυχαίο"
"φέρνει στο προσκήνιο" • "αποτελεί υπενθύμιση" • "ενδέχεται να επηρεάσει"

━━━ ΤΥΠΟΣ ΑΡΘΡΟΥ ━━━

${articleTypeInstructions[options.articleType]}

━━━ HTML ΔΟΜΗ ━━━

Χρησιμοποίησε: <h1>, <h2>, <h3>, <p>, <ul><li>, <ol><li>, <strong>, <em>, <blockquote>, <table>
ΟΧΙ: <html>, <body>, <head>, <script>, <style>
ΥΠΟΧΡΕΩΤΙΚΑ: Ξεκίνα με <h1> που περιέχει την primary keyword

━━━ ΠΑΡΑΜΕΤΡΟΙ ━━━

Primary Keyword: "${options.primaryKeyword}"
Secondary Keywords: ${options.secondaryKeywords.length ? options.secondaryKeywords.join(', ') : 'auto-generate από context'}
Κατηγορία: ${options.categoryName}
Τύπος: ${options.articleType}
Στόχος λέξεων: ${wordCount} (ΥΠΟΧΡΕΩΤΙΚΟ)

━━━ JSON OUTPUT FORMAT ━━━

{
  "title": "H1 τίτλος με primary keyword — SEO-optimized",
  "slug": "primary-keyword-latin-with-dashes",
  "excerpt": "2-3 προτάσεις, περιέχει keyword, κάνει preview του περιεχομένου",
  "contentHtml": "ΠΛΗΡΕΣ HTML ${wordCount} λέξεις — ΥΠΟΧΡΕΩΤΙΚΑ ξεκινά με <h1>",
  "seoTitle": "Primary keyword | ΑΙΣΧΟΛΙΑΣΜΟΣ — max 60 χαρακτήρες",
  "seoDescription": "Meta description με keyword και CTA — 80-155 χαρακτήρες",
  "searchIntent": "Informational|Commercial|Navigational|Transactional",
  "faqItems": ${options.generateFaq ? '[{"question": "Ερώτηση;", "answer": "Πλήρης απάντηση 100+ λέξεων"}, ...] — minimum 5 FAQ' : '[]'},
  "internalLinkSuggestions": ${options.generateInternalLinks ? '[{"anchorText": "κείμενο anchor", "topic": "θέμα άρθρου για link", "context": "πλαίσιο στο κείμενο"}, ...] — 3-5 προτάσεις' : '[]'},
  "contentCluster": {
    "relatedTopics": ["5 σχετικά θέματα για μελλοντική κάλυψη"],
    "futureArticles": ["5 προτεινόμενοι τίτλοι μελλοντικών άρθρων"]
  },
  "socialPosts": {
    "facebook": ${options.generateSocialPosts ? '"Facebook post: hook + γεγονός + ερώτηση που προκαλεί διαφωνία"' : '""'},
    "linkedin": ${options.generateSocialPosts ? '"LinkedIn: professional insight + value + CTA"' : '""'},
    "newsletter": ${options.generateSocialPosts ? '"Newsletter snippet 2-3 προτάσεις που δελεάζουν το κλικ"' : '""'}
  },
  "imagePrompt": ${options.generateImagePrompt ? '"Photorealistic scene in English for DALL-E, no text in image"' : '""'},
  "tags": ["5 ακριβείς SEO tags/keywords"]
}`;

  const userPrompt = `Γράψε ${options.articleType} evergreen άρθρο για: "${options.topic}"

Primary Keyword: "${options.primaryKeyword}"${
    options.secondaryKeywords.length
      ? `\nSecondary Keywords: ${options.secondaryKeywords.join(', ')}`
      : ''
  }`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 8000,
  });

  void logOpenAIUsage({
    service: 'evergreen',
    model: 'gpt-4o',
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    operation: 'Evergreen Generation',
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Κενή απάντηση από το AI');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Η απάντηση του AI δεν είναι έγκυρο JSON');
  }

  const validated = GeneratedEvergreenSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Μη έγκυρη δομή απάντησης AI: ${validated.error.message}`);
  }

  return validated.data;
}

export async function optimizeEvergreenContent(
  original: GeneratedEvergreen,
  issues: string[],
  primaryKeyword: string,
): Promise<GeneratedEvergreen> {
  const client = getClient();

  const systemPrompt = `Είσαι SEO content optimizer. Βελτίωσε το παρακάτω evergreen άρθρο.

━━━ ΠΡΟΒΛΗΜΑΤΑ ΠΟΥ ΠΡΕΠΕΙ ΝΑ ΔΙΟΡΘΩΣΕΙΣ ━━━
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

━━━ ΚΑΝΟΝΕΣ ━━━
- Primary keyword "${primaryKeyword}" να εμφανίζεται στο H1 και στις πρώτες 150 λέξεις
- SEO Title: 30-60 χαρακτήρες, περιέχει keyword
- Meta Description: 80-155 χαρακτήρες, περιέχει keyword και CTA
- H2: τουλάχιστον 4 H2 ενότητες
- Επέστρεψε ΑΚΡΙΒΩΣ το ίδιο JSON format χωρίς αλλαγές στα faqItems/internalLinkSuggestions/contentCluster`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(original) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 8000,
  });

  void logOpenAIUsage({
    service: 'evergreen',
    model: 'gpt-4o',
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    operation: 'Evergreen Optimization',
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return original;

  try {
    const validated = GeneratedEvergreenSchema.safeParse(JSON.parse(raw));
    if (validated.success) return validated.data;
  } catch {
    // keep original if parsing fails
  }

  return original;
}
