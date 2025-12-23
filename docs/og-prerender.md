Objetivo

Fornecer uma forma simples de gerar HTML com meta tags Open Graph para páginas de curso, de modo que WhatsApp/Facebook/Telegram leiam descrição e imagem ao compartilhar o link.

O que foi criado

- `server/og-server.js`: um servidor Node mínimo que expõe `/og/course/:idOrSlug`. Ele busca o curso no Supabase (por `id` ou `slug`) e retorna HTML contendo `og:*` e `twitter:*` tags apropriadas. O HTML também redireciona o usuário (via JS) para a rota SPA `/curso/:idOrSlug`.

Como usar localmente (rápido)

1. Garanta as variáveis de ambiente:

- `SUPABASE_URL` — URL do seu projeto Supabase
- `SUPABASE_KEY` — chave anulável (service role não necessária, mas precisa de permissões de leitura)
- Opcional: `SITE_ORIGIN` — o domínio público do site (ex.: https://edusampaioCursos.com.br). Se não definido, `http://localhost:3001` será usado.

2. Instale dependências (se ainda não tiver):

```bash
npm install
```

3. Rode o servidor:

```bash
SUPABASE_URL="https://..." SUPABASE_KEY="..." SITE_ORIGIN="https://edusampaioCursos.com" node server/og-server.js
```

4. Teste no navegador ou com curl:

```bash
curl http://localhost:3001/og/course/some-course-slug
```

Integração com WhatsApp / compartilhamento

- Em vez de compartilhar `https://seusite/cursos/slug` diretamente, compartilhe o endpoint prerender para crawlers:

```
https://seusite/og/course/slug
```

- Ao colar esse link no WhatsApp, o WhatsApp irá buscar o HTML deste endpoint e ler os meta tags (imagem/descrição) corretamente. O HTML redireciona o usuário em browsers normais para a página SPA final.

Deployment

- Você pode implantar `server/og-server.js` como uma "serverless function" (Vercel, Render, Railway) ou como um pequeno serviço (Heroku, Render).
- Em Vercel, crie uma rota serverless semelhante em `/api/og/course/[id].js` que contenha a mesma lógica (ajuste imports para CommonJS/ESM conforme necessário).

Limitações e recomendações

- Idealmente, implementar SSR ou prerender para todas as rotas importantes (ex.: páginas de curso) — isso evita necessidade de links alternativos e garante previews consistentes.
- O endpoint aqui é uma solução prática e rápida quando não for possível migrar toda a aplicação para SSR.

Segurança

- Proteja `SUPABASE_KEY` em variáveis de ambiente da plataforma de deploy; não exponha chaves em cliente.

Quer que eu:
- Adapte este endpoint para `Vercel` (arquivo `/api/og/course/[id].ts`) com instruções de deploy?  
- Ou eu já subo um README.md adicional com instruções passo-a-passo para deploy no Vercel/Render?  