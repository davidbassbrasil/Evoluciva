// Backend proxy simples para Asaas
// Execute: node backend-proxy.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli';
const ASAAS_API_URL = 'https://api-sandbox.asaas.com/v3';

// Proxy para todas as chamadas Asaas
app.all('/api/asaas/*', async (req, res) => {
  try {
    const path = req.params[0];
    const url = `${ASAAS_API_URL}/${path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Helpers for sharing (Open Graph) ---
function readEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, 'utf8');
    return content.split(/\r?\n/).reduce((acc, line) => {
      const m = line.match(/^([^=]+)=(.*)$/);
      if (m) acc[m[1].trim()] = m[2].trim();
      return acc;
    }, {});
  } catch (err) {
    return null;
  }
}

function getEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envLocal = readEnvFile(path.join(__dirname, '.env.local')) || readEnvFile(path.join(__dirname, '.env'));
  if (envLocal && envLocal[name]) return envLocal[name];
  return undefined;
}

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');
const SITE_URL = getEnvVar('SITE_URL') || 'https://seusite.com';

function escapeHtml(s = '') {
  return String(s).replace(/[&<>\"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

app.get('/share/curso/:slug', async (req, res) => {
  const slug = req.params.slug;
  if (!slug) return res.status(400).send('Missing slug');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(500).send('Supabase não configurado');

  try {
    const restUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/courses?select=title,description,full_description,image,slug,active&slug=eq.${encodeURIComponent(slug)}&limit=1`;
    const r = await fetch(restUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json'
      }
    });
    if (!r.ok) return res.status(502).send('Erro ao buscar course');
    const arr = await r.json();
    const course = Array.isArray(arr) && arr[0];
    if (!course) return res.status(404).send('Not found');

    const title = escapeHtml(course.title || '');
    const desc = escapeHtml(course.description || course.full_description || '');
    let img = course.image || '';
    if (img && !/^https?:\/\//i.test(img)) {
      // assume storage bucket 'images' (see supabase schema comments)
      img = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/images/${img}`;
    }

    const publicUrl = `${SITE_URL.replace(/\/$/, '')}/curso/${encodeURIComponent(course.slug || slug)}`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(`<!doctype html>
<html>
  <head>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    ${img ? `<meta property="og:image" content="${img}" />` : ''}
    <meta property="og:url" content="${publicUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0; url=${publicUrl}" />
  </head>
  <body>Redirecting...</body>
</html>`);
  } catch (error) {
    res.status(500).send('Internal error');
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Proxy Asaas rodando em http://localhost:${PORT}`);
  console.log(`Configure VITE_ASAAS_PROXY_URL=http://localhost:${PORT}/api/asaas`);
});
