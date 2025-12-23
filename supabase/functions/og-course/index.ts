import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_KEY') || '';
const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeHtml(s: string) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    // Expected usage: /<function-route>/<id-or-slug> or call with ?id=
    const parts = url.pathname.split('/').filter(Boolean);
    const raw = url.searchParams.get('id') || parts[parts.length - 1] || '';
    const idOrSlug = decodeURIComponent(raw || '');

    if (!idOrSlug) return new Response('Not found', { status: 404 });

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let course: any = null;
    if (isUUID) {
      const { data } = await supabase.from('courses').select('*').eq('id', idOrSlug).maybeSingle();
      course = data;
    } else {
      const { data } = await supabase.from('courses').select('*').eq('slug', idOrSlug).maybeSingle();
      course = data;
    }

    if (!course) return new Response('Not found', { status: 404 });

    const origin = SITE_ORIGIN || `${url.protocol}//${url.host}`;
    const pageUrl = `${origin}/curso/${course.slug || course.id}`;
    const image = course.image
      ? (course.image.startsWith('http') ? course.image : `${origin}${course.image}`)
      : `${origin}/logo_.png`;
    const description = (course.description || '').replace(/<[^>]+>/g, '').slice(0, 200);

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(course.title || 'Curso')}</title>

  <meta property="og:title" content="${escapeHtml(course.title || '')}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:alt" content="${escapeHtml(course.title || '')}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(course.title || '')}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <meta name="robots" content="index, follow" />
</head>
<body>
  <script>location.replace('${escapeHtml(pageUrl)}')</script>
  <noscript>
    <p>Abra este link: <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
  </noscript>
</body>
</html>`;

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch (err) {
    console.error('OG function error', err);
    return new Response('Internal error', { status: 500 });
  }
});
