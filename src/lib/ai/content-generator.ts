import OpenAI from 'openai';
import {
  GeneratedArticleSchema,
  type GeneratedArticle,
  type Tone,
  type ArticleType,
  type TargetLength,
  wordCountMap,
} from './schemas';

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

const toneInstructions: Record<Tone, string> = {
  informative: 'αντικειμενικό, δημοσιογραφικό ύφος, χωρίς υπερβολές',
  sharp: 'έντονο, κριτικό ύφος, με ισχυρές απόψεις',
  simple: 'απλή γλώσσα, εύκολη κατανόηση, χωρίς ορολογία',
  professional: 'επαγγελματικό, αναλυτικό, για ειδικούς',
  viral: 'εντυπωσιακοί τίτλοι, συναισθηματικό hook, shareable',
};

const articleTypeInstructions: Record<ArticleType, string> = {
  original: 'πρωτότυπο άρθρο με ανάλυση και γνώμη',
  summary: 'σύνοψη και επεξεργασία υπάρχουσας είδησης',
  opinion: 'άρθρο γνώμης / editorial με σαφή θέση',
  explainer: 'εξηγεί σε βάθος ένα θέμα με context και ιστορικό',
  listicle: 'λίστα με αριθμημένα σημεία, κάθε ένα με τίτλο και επεξήγηση',
};

export interface GenerateOptions {
  topic: string;
  categoryName: string;
  tone: Tone;
  articleType: ArticleType;
  targetLength: TargetLength;
  sourceUrl?: string;
  generateFacebookPost: boolean;
  generateAiCommentary: boolean;
}

export async function generateArticleContent(options: GenerateOptions): Promise<GeneratedArticle> {
  const client = getClient();
  const wordCount = wordCountMap[options.targetLength];

  const systemPrompt = `Είσαι επαγγελματίας δημοσιογράφος για ελληνικό ενημερωτικό portal.
Γράφεις ΠΑΝΤΑ στα Ελληνικά.
Κατηγορία: ${options.categoryName}
Ύφος: ${toneInstructions[options.tone]}
Τύπος: ${articleTypeInstructions[options.articleType]}
Στόχος: ~${wordCount} λέξεις στο contentHtml

Επιστρέφεις ΑΠΟΚΛΕΙΣΤΙΚΑ έγκυρο JSON (χωρίς markdown, χωρίς code blocks) με αυτά ακριβώς τα πεδία:

{
  "title": "Τίτλος άρθρου — δυναμικός, SEO-friendly",
  "slug": "latin-lowercase-with-dashes (μεταγράφεις Ελληνικά σε λατινικά)",
  "excerpt": "Εισαγωγή 2-3 προτάσεων που συνοψίζει το θέμα",
  "contentHtml": "Πλήρες HTML άρθρο. Χρησιμοποίησε <h2>, <h3>, <p>, <ul><li>, <strong>, <blockquote>. Μην βάλεις <html>/<body>/<head>.",
  "aiCommentary": "${options.generateAiCommentary ? 'Σύντομος αναλυτικός σχολιασμός 2-3 προτάσεων από AI perspective' : ''}",
  "seoTitle": "SEO τίτλος max 60 χαρακτήρες",
  "seoDescription": "Meta description max 155 χαρακτήρες",
  "facebookPost": "${options.generateFacebookPost ? 'Engaging Facebook post 2-3 προτάσεων με 2-3 emoji' : ''}",
  "imagePrompt": "Photorealistic news image description in English for DALL-E, describe scene/subject without text",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const userPrompt = `Γράψε άρθρο για: "${options.topic}"${
    options.sourceUrl ? `\n\nΠηγή/αναφορά: ${options.sourceUrl}` : ''
  }`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.75,
    max_tokens: 4500,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Κενή απάντηση από το AI');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Η απάντηση του AI δεν είναι έγκυρο JSON');
  }

  const validated = GeneratedArticleSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Μη έγκυρη δομή απάντησης AI: ${validated.error.message}`);
  }

  return validated.data;
}
