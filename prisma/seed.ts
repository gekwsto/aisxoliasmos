import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!rawPassword) {
    throw new Error('ADMIN_INITIAL_PASSWORD environment variable is not set');
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aisxoliasmos.com' },
    update: { passwordHash },
    create: {
      name: 'Admin',
      email: 'admin@aisxoliasmos.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin user ready: ${admin.email}`);

  // ─── Categories ──────────────────────────────────────────────────────────────

  const categoryData = [
    { name: 'AI', slug: 'ai', color: '#7c3aed' },
    { name: 'Τεχνολογία', slug: 'texnologia', color: '#2563eb' },
    { name: 'Οικονομία', slug: 'oikonomia', color: '#059669' },
    { name: 'Επιχειρηματικότητα', slug: 'epixeirimatikotita', color: '#d97706' },
    { name: 'Ελλάδα', slug: 'ellada', color: '#0891b2' },
    { name: 'Κόσμος', slug: 'kosmos', color: '#4f46e5' },
    { name: 'Viral', slug: 'viral', color: '#db2777' },
    { name: 'Απόψεις', slug: 'apopseis', color: '#475569' },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log(`✅ ${categoryData.length} categories ready`);

  // ─── RSS Sources ─────────────────────────────────────────────────────────────

  // Fetch category IDs by slug
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const rssSourceData = [
    // AI
    {
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      categorySlug: 'ai',
    },
    {
      name: 'The Verge AI',
      url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
      categorySlug: 'ai',
    },
    {
      name: 'MIT Technology Review',
      url: 'https://www.technologyreview.com/feed/',
      categorySlug: 'ai',
    },
    // Τεχνολογία
    {
      name: 'The Verge',
      url: 'https://www.theverge.com/rss/index.xml',
      categorySlug: 'texnologia',
    },
    {
      name: 'Ars Technica',
      url: 'https://feeds.arstechnica.com/arstechnica/index',
      categorySlug: 'texnologia',
    },
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
      categorySlug: 'texnologia',
    },
    // Οικονομία
    {
      name: 'Reuters Business',
      url: 'https://feeds.reuters.com/reuters/businessNews',
      categorySlug: 'oikonomia',
    },
    {
      name: 'Bloomberg Markets',
      url: 'https://feeds.bloomberg.com/markets/news.rss',
      categorySlug: 'oikonomia',
    },
    // Επιχειρηματικότητα
    {
      name: 'TechCrunch Startups',
      url: 'https://techcrunch.com/category/startups/feed/',
      categorySlug: 'epixeirimatikotita',
    },
    {
      name: 'Harvard Business Review',
      url: 'https://feeds.hbr.org/harvardbusiness',
      categorySlug: 'epixeirimatikotita',
    },
    // Κόσμος
    {
      name: 'Reuters World',
      url: 'https://feeds.reuters.com/reuters/worldNews',
      categorySlug: 'kosmos',
    },
    {
      name: 'BBC World',
      url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      categorySlug: 'kosmos',
    },
  ];

  let sourcesCreated = 0;
  for (const source of rssSourceData) {
    const categoryId = catMap[source.categorySlug];
    if (!categoryId) {
      console.warn(`⚠ Category not found for slug: ${source.categorySlug}`);
      continue;
    }
    await prisma.rssSource.upsert({
      where: { url: source.url },
      update: {},
      create: {
        name: source.name,
        url: source.url,
        categoryId,
        enabled: true,
      },
    });
    sourcesCreated++;
  }

  console.log(`✅ ${sourcesCreated} RSS sources ready`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
