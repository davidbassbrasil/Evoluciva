// Backend proxy simples para Asaas
// Execute: node backend-proxy.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Proxy Asaas rodando em http://localhost:${PORT}`);
  console.log(`Configure VITE_ASAAS_PROXY_URL=http://localhost:${PORT}/api/asaas`);
});
