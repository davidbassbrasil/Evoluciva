# 🚀 Migração de HashRouter para BrowserRouter - Locaweb

## 📋 Visão Geral

Este guia explica como migrar o site **Edu Sampaio Cursos** de **HashRouter** para **BrowserRouter** no **Locaweb**, melhorando significativamente o SEO.

---

## ✅ Por que migrar?

### HashRouter (Atual)
- ❌ URLs com hash: `edusampaio.com.br/#/cursos`
- ❌ SEO limitado (Google precisa renderizar JS)
- ❌ Compartilhamento social problemático
- ❌ URLs canônicas não funcionam bem

### BrowserRouter (Depois da Migração)
- ✅ URLs limpas: `edusampaio.com.br/cursos`
- ✅ SEO perfeito
- ✅ Compartilhamento social funciona 100%
- ✅ URLs canônicas funcionam perfeitamente
- ✅ Melhor experiência do usuário

---

## 🔧 PASSO A PASSO DA MIGRAÇÃO

### **ETAPA 1: Atualizar o código React**

#### 1.1 Mudar de HashRouter para BrowserRouter

**Arquivo:** `src/App.tsx`

```tsx
// ❌ ANTES (HashRouter)
import { HashRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRouter>
          <Routes>
            {/* ... rotas ... */}
          </Routes>
        </HashRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};
```

```tsx
// ✅ DEPOIS (BrowserRouter)
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* ... rotas ... */}
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};
```

**🔨 Mudanças necessárias:**
- Trocar `HashRouter` por `BrowserRouter` (1 linha apenas!)

---

#### 1.2 Atualizar URLs canônicas em index.html

**Arquivo:** `index.html`

```html
<!-- ❌ ANTES -->
<link rel="canonical" href="https://www.edusampaio.com.br/#/" />

<!-- ✅ DEPOIS -->
<link rel="canonical" href="https://www.edusampaio.com.br/" />
```

---

#### 1.3 Atualizar sitemap.xml

**Arquivo:** `public/sitemap.xml`

```xml
<!-- ❌ ANTES (com #) -->
<url>
  <loc>https://www.edusampaio.com.br/#/cursos</loc>
  <priority>0.9</priority>
</url>

<!-- ✅ DEPOIS (sem #) -->
<url>
  <loc>https://www.edusampaio.com.br/cursos</loc>
  <priority>0.9</priority>
</url>
```

**🔨 Remover `#/` de TODAS as URLs no sitemap.**

---

#### 1.4 Atualizar schemas.ts (URLs canônicas)

**Arquivo:** `src/lib/schemas.ts`

Verificar se alguma função gera URLs com `#/`. Se sim, remover:

```typescript
// ❌ ANTES
const url = `https://www.edusampaio.com.br/#/curso/${curso.slug}`;

// ✅ DEPOIS
const url = `https://www.edusampaio.com.br/curso/${curso.slug}`;
```

---

### **ETAPA 2: Configurar .htaccess no Locaweb**

#### 2.1 Criar arquivo .htaccess

**Arquivo:** `.htaccess` (na raiz do projeto)

Já criado! Veja o arquivo `.htaccess` na raiz do projeto.

**O que ele faz:**
- ✅ Redireciona todas as rotas para `index.html`
- ✅ Mantém arquivos estáticos funcionando (CSS, JS, imagens)
- ✅ Adiciona compressão GZIP (performance)
- ✅ Adiciona cache de arquivos estáticos
- ✅ Adiciona headers de segurança

---

#### 2.2 Fazer upload do .htaccess para Locaweb

**Importante:**
1. ✅ Fazer build do projeto: `npm run build`
2. ✅ Fazer upload da pasta `dist/` para Locaweb
3. ✅ Fazer upload do `.htaccess` **NA RAIZ** (mesmo nível que index.html)

**Estrutura no servidor Locaweb:**
```
public_html/
├── .htaccess          ← IMPORTANTE: Na raiz!
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-xyz456.css
├── sitemap.xml
├── robots.txt
└── ...
```

---

### **ETAPA 3: Testar localmente**

Antes de fazer upload para Locaweb, teste localmente:

#### 3.1 Build de produção

```powershell
npm run build
```

#### 3.2 Testar com servidor local

```powershell
# Opção 1: Usar serve
npx serve -s dist

# Opção 2: Usar http-server
npx http-server dist -p 8080 --proxy http://localhost:8080?
```

#### 3.3 Testar as rotas

Abra o navegador e teste:
- ✅ `http://localhost:8080/` (Home)
- ✅ `http://localhost:8080/cursos` (Lista de cursos)
- ✅ `http://localhost:8080/sobre` (Sobre)
- ✅ Refresh na página (F5) - deve continuar funcionando!

**Se der erro 404 ao dar refresh:**
- ❌ Problema no servidor (falta .htaccess ou configuração)

---

### **ETAPA 4: Deploy no Locaweb**

#### 4.1 Upload via FTP

**Ferramentas recomendadas:**
- FileZilla
- WinSCP
- FTP do próprio Locaweb

**Passos:**
1. ✅ Conectar no FTP do Locaweb
2. ✅ Ir para `public_html/`
3. ✅ Fazer backup dos arquivos antigos (opcional)
4. ✅ Upload de tudo dentro de `dist/`
5. ✅ Upload do `.htaccess` **NA RAIZ**

#### 4.2 Verificar permissões

No Locaweb, o `.htaccess` precisa ter permissões corretas:
- ✅ Permissão: `644` (rw-r--r--)

**Como verificar:**
1. Conectar via FTP
2. Clicar com botão direito no `.htaccess`
3. "Permissões de arquivo"
4. Setar como `644`

---

### **ETAPA 5: Testar no ar**

#### 5.1 Testar URLs diretas

Abra o navegador e teste:
- ✅ `https://www.edusampaio.com.br/` (Home)
- ✅ `https://www.edusampaio.com.br/cursos` (Cursos)
- ✅ `https://www.edusampaio.com.br/sobre` (Sobre)
- ✅ `https://www.edusampaio.com.br/curso/algum-slug` (Curso específico)

#### 5.2 Testar refresh (F5)

Em cada página, aperte **F5** (refresh):
- ✅ Deve continuar na mesma página
- ❌ Se der erro 404 → problema no `.htaccess`

#### 5.3 Testar compartilhamento social

Use as ferramentas de debug:
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

Cole a URL e veja se aparecem:
- ✅ Título
- ✅ Descrição
- ✅ Imagem (og:image)

---

### **ETAPA 6: SEO pós-migração**

#### 6.1 Google Search Console

1. ✅ Enviar novo sitemap (sem `#/`)
2. ✅ Solicitar indexação das URLs principais
3. ✅ Usar "Inspeção de URL" para testar

#### 6.2 Redirects (Opcional, mas recomendado)

Se o site já está no ar com HashRouter, você pode:

**Opção 1: JavaScript Redirect (dentro do App.tsx)**

```typescript
// Redirecionar URLs antigas com # para novas sem #
useEffect(() => {
  if (window.location.hash) {
    const path = window.location.hash.replace('#', '');
    window.history.replaceState(null, '', path);
  }
}, []);
```

**Opção 2: .htaccess Redirect (mais avançado)**

```apache
# Adicionar no .htaccess
<IfModule mod_rewrite.c>
  # Redirecionar URLs antigas com # para novas sem #
  RewriteCond %{REQUEST_URI} !^.*#.*$
  RewriteRule ^(.*)$ /$1 [R=301,L]
</IfModule>
```

---

## 📊 Checklist Final

Antes de considerar a migração completa:

### Código
- [ ] `HashRouter` trocado por `BrowserRouter` em `App.tsx`
- [ ] URLs canônicas atualizadas em `index.html`
- [ ] `sitemap.xml` atualizado (sem `#/`)
- [ ] `schemas.ts` verificado (sem URLs com `#/`)

### Servidor (Locaweb)
- [ ] Arquivo `.htaccess` criado
- [ ] `.htaccess` com permissões `644`
- [ ] `.htaccess` na raiz (`public_html/`)
- [ ] Build feito (`npm run build`)
- [ ] Upload de `dist/` + `.htaccess` para Locaweb

### Testes
- [ ] Home funciona: `edusampaio.com.br/`
- [ ] Cursos funciona: `edusampaio.com.br/cursos`
- [ ] Sobre funciona: `edusampaio.com.br/sobre`
- [ ] Refresh (F5) funciona em todas as páginas
- [ ] Console do navegador sem erros 404
- [ ] Compartilhamento social funciona (Facebook, Twitter)

### SEO
- [ ] Novo sitemap enviado ao Google Search Console
- [ ] URLs principais solicitadas para indexação
- [ ] Inspeção de URL no Search Console (verifica renderização)

---

## 🚨 Troubleshooting

### Problema: Erro 404 ao dar refresh

**Causa:** `.htaccess` não está funcionando

**Soluções:**
1. ✅ Verificar se `.htaccess` está na raiz (`public_html/`)
2. ✅ Verificar permissões (`644`)
3. ✅ Verificar se Locaweb tem `mod_rewrite` habilitado (geralmente tem)
4. ✅ Testar com `.htaccess` simplificado:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

### Problema: CSS/JS não carregam

**Causa:** Caminhos relativos incorretos

**Solução:**
1. ✅ Verificar `base` no `index.html`:

```html
<head>
  <base href="/">
  <!-- resto do head -->
</head>
```

2. ✅ Verificar `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/', // URL base do site
  // ...
});
```

---

### Problema: Imagens não carregam

**Causa:** Caminhos relativos ou falta de arquivos

**Solução:**
1. ✅ Verificar se pasta `assets/` foi enviada
2. ✅ Usar caminhos absolutos: `/assets/image.jpg`
3. ✅ Verificar permissões das pastas (755)

---

### Problema: Links quebrados

**Causa:** Links ainda usando `#/`

**Solução:**
1. ✅ Buscar por `#/` no código:
   ```powershell
   grep -r "#/" src/
   ```
2. ✅ Substituir todos por `/`

---

## 🎯 Resumo

**Antes (HashRouter):**
- URL: `edusampaio.com.br/#/cursos`
- SEO: ⭐⭐⭐ (limitado)

**Depois (BrowserRouter):**
- URL: `edusampaio.com.br/cursos`
- SEO: ⭐⭐⭐⭐⭐ (perfeito)

**Complexidade:** Média
**Tempo estimado:** 1-2 horas
**Custo:** Grátis

---

## 📚 Recursos Adicionais

- [React Router BrowserRouter Docs](https://reactrouter.com/en/main/router-components/browser-router)
- [Apache mod_rewrite Docs](https://httpd.apache.org/docs/current/mod/mod_rewrite.html)
- [Google Search Console](https://search.google.com/search-console)
- [Locaweb Suporte](https://ajuda.locaweb.com.br/)

---

**Última atualização:** 13/12/2024
**Versão:** 1.0
