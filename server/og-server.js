import http from 'http';
import url from 'url';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PORT = process.env.PORT || 3001;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_KEY not set. The server will not be able to fetch course data.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function getCourse(idOrSlug) {
  if (!supabase) return null;
  try {
    // Try by id (UUID) first
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUUID) {
      const { data, error } = await supabase.from('courses').select('*').eq('id', idOrSlug).maybeSingle();
      if (error) return null;
      return data;
    }

    // fallback to slug
    const { data, error } = await supabase.from('courses').select('*').eq('slug', idOrSlug).maybeSingle();
    if (error) return null;
    return data;
  } catch (err) {
    console.error('Error fetching course from supabase', err);
    return null;
  }
}

function renderHTML({ title, description, image, url: pageUrl }) {
  const safeTitle = escapeHtml(title || 'Curso');
  const safeDesc = escapeHtml(description || '');
  const safeImage = escapeHtml(image || `${pageUrl.origin}/logo_.png`);
  const safeUrl = escapeHtml(pageUrl.href);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <meta name="robots" content="index, follow" />
</head>
<body>
  <script>
    // redirect users to the client-side page
    window.location.replace('${safeUrl}');
  </script>
  <noscript>
    <p>Abra este link: <a href="${safeUrl}">${safeUrl}</a></p>
  </noscript>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url || '', true);
  const path = parsed.pathname || '';

  // Expected route: /og/course/:idOrSlug
  const match = path.match(/^\/og\/course\/(.+)$/);
  if (!match) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const idOrSlug = decodeURIComponent(match[1]);
  // Fetch course data
  const course = await getCourse(idOrSlug);

  if (!course) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Course not found');
    return;
  }

  // Build absolute URL for course page and image
  const origin = process.env.SITE_ORIGIN || `http://localhost:${PORT}`;
  const pageUrl = new URL(`/curso/${course.slug || course.id}`, origin);
  const image = course.image ? (course.image.startsWith('http') ? course.image : `${origin}${course.image}`) : `${origin}/logo_.png`;

  const description = (course.description || '').replace(/<[^>]+>/g, '').slice(0, 200);

  const html = renderHTML({ title: course.title, description, image, url: pageUrl });

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`OG server listening on http://localhost:${PORT}`);
  console.log('Usage: /og/course/:idOrSlug');
});
