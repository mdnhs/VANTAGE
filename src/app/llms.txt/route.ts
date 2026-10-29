import { siteEnvFrom } from '@/lib/seo/robots';
import { getLlmsTxt } from '@/server/queries/get-llms-txt';

// AI assistants read this like robots.txt; staging stays out of it as it stays out of search.
export async function GET() {
  const staging = siteEnvFrom({ SITE_ENV: process.env.SITE_ENV, VERCEL_ENV: process.env.VERCEL_ENV }) === 'staging';
  const body = staging ? null : await getLlmsTxt();
  if (!body) return new Response('Not found', { status: 404 });
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
