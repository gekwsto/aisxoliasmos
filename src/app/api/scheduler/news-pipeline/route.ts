import { NextResponse } from 'next/server';
import { runNewsPipeline } from '@/services/news-auto-pipeline';

export const runtime = 'nodejs';
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const envSecret = process.env.CRON_SECRET;

  const xCronHeader = request.headers.get('x-cron-secret');
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');

  const hasXCron = xCronHeader === envSecret;
  const hasBearer = authHeader === `Bearer ${envSecret}`;
  const hasQuery = querySecret === envSecret;

  console.log('[news-pipeline] auth check', {
    hasCronSecretEnv: Boolean(envSecret),
    hasXCronSecretHeader: Boolean(xCronHeader),
    hasAuthorizationHeader: Boolean(authHeader),
    hasQuerySecret: Boolean(querySecret),
    authMethodMatched: hasXCron || hasBearer || hasQuery,
  });

  if (!envSecret) return true;
  return hasXCron || hasBearer || hasQuery;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runNewsPipeline();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runNewsPipeline();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
