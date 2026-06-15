export const SITE_URL = 'https://aisxoliasmos.gr';
export const SITE_NAME = 'ΑΙΣΧΟΛΙΑΣΜΟΣ';
export const SITE_DESCRIPTION =
  'Ενημερωτικό portal για AI, Τεχνολογία, Οικονομία και Επικαιρότητα με έξυπνο σχολιασμό.';
export const SITE_LOCALE = 'el_GR';
export const SITE_TWITTER = '@aisxoliasmos';

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function articleCanonical(slug: string): string {
  return canonicalUrl(`/article/${slug}`);
}

export function categoryCanonical(slug: string): string {
  return canonicalUrl(`/category/${slug}`);
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    sameAs: [
      'https://twitter.com/aisxoliasmos',
      'https://facebook.com/aisxoliasmos',
      'https://instagram.com/aisxoliasmos',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@aisxoliasmos.gr',
      contactType: 'editorial',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'el',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/articles?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function newsArticleJsonLd(article: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  articleType?: string;
}) {
  const schemaType = article.articleType === 'NEWS' ? 'NewsArticle' : 'Article';
  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': articleCanonical(article.slug),
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleCanonical(article.slug),
    },
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    inLanguage: 'el',
    ...(article.imageUrl
      ? {
          image: {
            '@type': 'ImageObject',
            url: article.imageUrl,
            width: 1200,
            height: 630,
          },
        }
      : {}),
  };
}

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function categoryPageJsonLd(category: {
  name: string;
  slug: string;
  description: string;
  articleCount: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': categoryCanonical(category.slug),
    name: `${category.name} — ${SITE_NAME}`,
    description: category.description,
    url: categoryCanonical(category.slug),
    inLanguage: 'el',
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}
