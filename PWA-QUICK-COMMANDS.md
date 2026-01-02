# 🚀 Comandos Rápidos - PWA

## Desenvolvimento

```powershell
# Executar em modo desenvolvimento
npm run dev
# Acesse: http://localhost:8080/aluno/login
```

## Build e Preview

```powershell
# Build de produção
npm run build

# Preview da build
npm run preview
# Acesse: http://localhost:4173/aluno/login
```

## Testes Rápidos

### Verificar se arquivos PWA foram gerados
```powershell
# Verificar manifest.json
Get-Content .\dist\manifest.json

# Verificar service-worker.js
Get-Content .\dist\service-worker.js

# Listar todos os ícones
Get-ChildItem .\dist\*.png
```

### Limpar e reconstruir
```powershell
# Limpar node_modules e cache
Remove-Item -Recurse -Force node_modules, dist, .vite

# Reinstalar dependências
npm install

# Build limpo
npm run build
```

## Deploy

### Vercel
```powershell
# Instalar Vercel CLI (primeira vez)
npm i -g vercel

# Deploy
vercel

# Deploy em produção
vercel --prod
```

### Netlify
```powershell
# Instalar Netlify CLI (primeira vez)
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy em produção
netlify deploy --prod
```

## Testes no Chrome DevTools

1. Abrir DevTools: `F12`
2. Ir para: **Application**
3. Verificar:
   - **Manifest**: Ver configurações do PWA
   - **Service Workers**: Ver status do SW
   - **Cache Storage**: Ver recursos em cache
   - **Storage**: Limpar dados se necessário

## URLs de Teste

- **Desenvolvimento**: http://localhost:8080/aluno/login
- **Preview**: http://localhost:4173/aluno/login
- **Produção**: https://seudominio.com/aluno/login

## Simular Mobile no Chrome

1. `F12` para abrir DevTools
2. `Ctrl + Shift + M` para toggle device toolbar
3. Selecionar dispositivo (ex: iPhone 12 Pro)
4. Recarregar a página
5. O prompt de instalação deve aparecer

## Limpar Cache do PWA

### No navegador
```javascript
// Console do DevTools (F12)

// Desregistrar service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Limpar caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Limpar localStorage do prompt
localStorage.removeItem('pwa-install-dismissed');
```

### Reiniciar limpo
1. Abrir DevTools (F12)
2. **Application** → **Clear storage**
3. Marcar todas as opções
4. Clicar em "Clear site data"
5. Recarregar a página

## Verificações Rápidas

```powershell
# Ver se está rodando
Get-Process node

# Ver portas em uso
netstat -ano | Select-String "8080|4173"

# Matar processo na porta 8080
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process

# Matar processo na porta 4173
Get-Process -Id (Get-NetTCPConnection -LocalPort 4173).OwningProcess | Stop-Process
```

## Logs Úteis

```javascript
// Console do navegador

// Verificar se SW está registrado
navigator.serviceWorker.getRegistrations()

// Verificar modo standalone
window.matchMedia('(display-mode: standalone)').matches

// Verificar caches
caches.keys()

// Ver conteúdo de um cache
caches.open('edusampaio-pwa-v1').then(cache => cache.keys())

// Forçar atualização do SW
navigator.serviceWorker.getRegistration().then(reg => reg.update())
```

## Atalhos do Teclado (DevTools)

- `F12` - Abrir/Fechar DevTools
- `Ctrl + Shift + M` - Toggle device toolbar
- `Ctrl + Shift + R` - Hard reload (ignora cache)
- `Ctrl + Shift + Del` - Limpar dados do navegador
- `Ctrl + Shift + I` - Abrir DevTools (alternativa)
- `Ctrl + Shift + C` - Inspeção de elemento

## Checklist Antes do Deploy

- [ ] `npm run build` sem erros
- [ ] `manifest.json` existe em `/dist`
- [ ] `service-worker.js` existe em `/dist`
- [ ] Ícones existem em `/dist`
- [ ] Testar em Chrome mobile (DevTools)
- [ ] Verificar que HTTPS está configurado
- [ ] Testar instalação
- [ ] Testar funcionamento offline

## Problemas Comuns

### Build falhando
```powershell
# Limpar tudo
Remove-Item -Recurse -Force node_modules, dist, .vite, package-lock.json

# Reinstalar
npm install

# Build novamente
npm run build
```

### Service Worker não registrando
- Verificar console por erros
- Confirmar que está em HTTPS (ou localhost)
- Limpar cache do navegador
- Tentar em aba anônima

### Prompt não aparecendo
```javascript
// Limpar flag de dismissed
localStorage.removeItem('pwa-install-dismissed');
// Recarregar
location.reload();
```

---

**Dica**: Mantenha o DevTools aberto na aba Application enquanto desenvolve PWA!
