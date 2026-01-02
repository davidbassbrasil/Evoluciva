# 🔧 Correções Aplicadas - PWA Locaweb

## ❌ Problemas Identificados e Corrigidos

### 1. Service Worker tentando fazer cache de rotas SPA
**Problema**: O SW tentava cachear URLs como `/aluno/dashboard` que não existem como arquivos.
**Solução**: Modificado para cachear apenas recursos estáticos reais.

### 2. Falta de configuração do servidor
**Problema**: Servidor não configurado para SPA e PWA.
**Solução**: Criado `.htaccess` com todas as configurações necessárias.

### 3. Logs insuficientes para debug
**Problema**: Difícil identificar onde estava falhando.
**Solução**: Adicionados logs detalhados em todos os pontos críticos.

### 4. Manifest com start_url problemática
**Problema**: start_url apontava para rota que pode não estar disponível.
**Solução**: Ajustado para `/` (root).

## ✅ O Que Foi Corrigido

### 📄 Arquivos Modificados

#### 1. `service-worker.js`
- ✅ Removidas rotas SPA do cache inicial
- ✅ Adicionado tratamento separado para navegação vs assets
- ✅ Network-first para HTML, cache-first para assets
- ✅ Melhor tratamento de erros com Promise.allSettled
- ✅ Logs detalhados para debug

#### 2. `manifest.json`
- ✅ start_url alterado de `/aluno/dashboard` para `/`
- ✅ Adicionado campo `id` para identificação única
- ✅ Mantidas todas as outras configurações

#### 3. `main.tsx`
- ✅ Adicionado scope explícito no registro
- ✅ Logs detalhados de sucesso e erro
- ✅ Informações sobre estado do registration
- ✅ Melhor tratamento de erros

#### 4. `.htaccess` (NOVO)
- ✅ Configuração para SPA (redirect para index.html)
- ✅ MIME types corretos para todos os arquivos
- ✅ Service Worker sem cache
- ✅ Headers de segurança
- ✅ Compressão gzip
- ✅ Cache control adequado

## 🚀 Como Fazer o Deploy

### Passo 1: Build
```powershell
npm run build
```

### Passo 2: Verificar arquivos gerados
```powershell
# Deve ter todos estes arquivos em dist/
dir dist\manifest.json
dir dist\service-worker.js
dir dist\.htaccess
dir dist\icon-192.png
dir dist\icon-512.png
```

### Passo 3: Upload para Locaweb
1. Fazer upload de TODA a pasta `dist/` para o servidor
2. Garantir que o `.htaccess` foi enviado
3. **IMPORTANTE**: Verificar se está em HTTPS

### Passo 4: Verificações no Servidor

#### A. Verificar HTTPS
```
✅ Site DEVE estar em HTTPS
❌ PWA não funciona em HTTP (exceto localhost)
```

Acesse: `https://seudominio.com` (não http://)

#### B. Verificar Service Worker
Abrir DevTools (F12) e ir para Console.

Deve aparecer:
```
[PWA] Attempting to register service worker...
[PWA] Service Worker registered successfully: /
[SW] Installing service worker...
[SW] Opened cache
[SW] Cache initialized
```

Se aparecer erro, anotar a mensagem exata.

#### C. Verificar Manifest
No DevTools:
1. Application → Manifest
2. Verificar se aparece corretamente
3. Verificar se ícones carregam

#### D. Verificar Arquivos
Testar se os arquivos estão acessíveis:
- `https://seudominio.com/manifest.json` → Deve abrir o JSON
- `https://seudominio.com/service-worker.js` → Deve abrir o JS
- `https://seudominio.com/icon-192.png` → Deve mostrar o ícone

## 🔍 Checklist de Troubleshooting

### 1. Service Worker não registra

**Verifique:**
- [ ] Site está em HTTPS?
- [ ] Arquivo `service-worker.js` existe na raiz?
- [ ] Console mostra algum erro?
- [ ] `.htaccess` foi enviado?

**Se erro "Failed to register":**
```javascript
// No Console do DevTools (F12)
navigator.serviceWorker.register('/service-worker.js')
  .then(reg => console.log('OK:', reg))
  .catch(err => console.error('ERRO:', err));
```

### 2. Manifest não carrega

**Verifique:**
- [ ] `manifest.json` existe na raiz?
- [ ] Link no HTML está correto?
- [ ] MIME type está correto?

**Teste direto:**
```
https://seudominio.com/manifest.json
```

Deve retornar JSON com `Content-Type: application/manifest+json`

### 3. Prompt de instalação não aparece

**Verifique:**
- [ ] Está acessando de um mobile?
- [ ] Service Worker registrou com sucesso?
- [ ] Manifest carregou?
- [ ] Já instalou antes?
- [ ] Já dispensou nos últimos 7 dias?

**Limpar estado:**
```javascript
// Console do DevTools
localStorage.removeItem('pwa-install-dismissed');
location.reload();
```

### 4. Rotas da SPA não funcionam

**Verifique:**
- [ ] `.htaccess` foi enviado?
- [ ] Apache tem `mod_rewrite` ativo?
- [ ] Testou acessar uma rota direto (ex: `/aluno/dashboard`)?

**Se der 404:**
- Verificar se `.htaccess` está na raiz
- Verificar logs do Apache
- Contactar suporte Locaweb para ativar `mod_rewrite`

### 5. Assets não carregam

**Verifique:**
- [ ] Console mostra erros 404?
- [ ] Caminhos dos assets estão corretos?
- [ ] CORS configurado?

## 📱 Testar no Celular

### Android (Chrome)
1. Abrir Chrome no celular
2. Ir para `https://seudominio.com/aluno/login`
3. Abrir DevTools remotamente (chrome://inspect)
4. Verificar logs no Console
5. Verificar se prompt aparece

### iOS (Safari)
1. Abrir Safari no iPhone
2. Ir para `https://seudominio.com/aluno/login`
3. Verificar se card com instruções aparece
4. Tentar seguir instruções para instalar

## 🛠️ Comandos Úteis de Debug

### No Console do Navegador (F12)

```javascript
// 1. Verificar se SW está registrado
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registrations:', regs);
  regs.forEach(reg => {
    console.log('Scope:', reg.scope);
    console.log('Active:', reg.active);
  });
});

// 2. Verificar caches
caches.keys().then(keys => console.log('Caches:', keys));

// 3. Verificar modo standalone
console.log('Is standalone:', window.matchMedia('(display-mode: standalone)').matches);

// 4. Verificar manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m))
  .catch(e => console.error('Manifest error:', e));

// 5. Limpar tudo e começar de novo
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
localStorage.clear();
location.reload();
```

## 📞 Suporte Locaweb

Se ainda não funcionar, contactar suporte e verificar:

1. **mod_rewrite** está ativo?
2. **.htaccess** está sendo processado?
3. **HTTPS** está configurado?
4. **Headers** podem ser modificados?
5. **MIME types** estão corretos?

## ✅ Checklist Final

Antes de considerar concluído:

- [ ] Build gerou todos os arquivos
- [ ] Upload completo feito
- [ ] Site está em HTTPS
- [ ] `manifest.json` acessível
- [ ] `service-worker.js` acessível
- [ ] `.htaccess` no servidor
- [ ] Console não mostra erros críticos
- [ ] Service Worker registrou
- [ ] Manifest carregou
- [ ] Testado no mobile
- [ ] Prompt aparece (ou não aparece com razão válida)

## 🎯 Resultado Esperado

Quando tudo estiver funcionando:

### Console (F12)
```
[PWA] Attempting to register service worker...
[PWA] Service Worker registered successfully: /
[PWA] Registration details: {active: true, installing: false, waiting: false}
[SW] Installing service worker...
[SW] Opened cache
[SW] Cache initialized
```

### DevTools → Application → Service Workers
```
✓ service-worker.js
Status: activated and running
```

### DevTools → Application → Manifest
```
✓ Nome: Edu Sampaio - Área do Aluno
✓ Ícones carregados
✓ Sem erros
```

### No Mobile
```
✓ Card de instalação aparece
✓ Pode clicar em Instalar (Android)
✓ Instruções aparecem (iOS)
```

## 📄 Arquivos para Upload

Certifique-se de que TODOS estes arquivos estão no servidor:

```
seudominio.com/
├── index.html
├── manifest.json ⚠️ OBRIGATÓRIO
├── service-worker.js ⚠️ OBRIGATÓRIO
├── .htaccess ⚠️ OBRIGATÓRIO
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
├── favicon.png
├── robots.txt
├── sitemap.xml
└── assets/
    ├── main-*.js
    ├── main-*.css
    └── [imagens]
```

---

**Importante**: Se após todas essas correções ainda não funcionar, envie:
1. URL do site
2. Screenshot do Console (F12)
3. Screenshot do DevTools → Application → Manifest
4. Screenshot do DevTools → Application → Service Workers
5. Se está em HTTPS

Isso ajudará a identificar o problema específico!
