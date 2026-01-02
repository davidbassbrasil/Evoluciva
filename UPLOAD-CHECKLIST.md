# ✅ Checklist de Upload - Locaweb

## 📋 Antes do Upload

- [x] Build executado: `npm run build`
- [x] Verificação passou: `.\check-pwa.ps1`
- [x] Arquivos PWA gerados (manifest, service-worker, .htaccess)

## 📤 Arquivos para Upload

Fazer upload de **TODA** a pasta `dist/` contendo:

### Arquivos Essenciais PWA
- [ ] `manifest.json` (1.2 KB)
- [ ] `service-worker.js` (3.5 KB)
- [ ] `.htaccess` (3.3 KB) ⚠️ **ARQUIVO OCULTO!**

### Ícones
- [ ] `icon-192.png`
- [ ] `icon-512.png`
- [ ] `apple-touch-icon.png`
- [ ] `favicon.png`

### Arquivos do App
- [ ] `index.html`
- [ ] `robots.txt`
- [ ] `sitemap.xml`
- [ ] Pasta `assets/` completa

## 🔧 Configuração no Locaweb

### Painel de Controle

1. **Gerenciador de Arquivos**
   - [ ] Acessar o gerenciador de arquivos
   - [ ] Ir para a pasta `public_html` (ou equivalente)
   - [ ] Fazer upload de todos os arquivos

2. **Verificar .htaccess**
   - [ ] Arquivo `.htaccess` está visível no servidor?
   - [ ] Se não, ativar "Mostrar arquivos ocultos"
   - [ ] Verificar conteúdo do arquivo

3. **SSL/HTTPS**
   - [ ] Certificado SSL está instalado?
   - [ ] Site redireciona para HTTPS?
   - [ ] Testar: `https://seudominio.com`

4. **Permissões**
   - [ ] Arquivos: 644
   - [ ] Pastas: 755
   - [ ] `.htaccess`: 644

## 🧪 Testes Após Upload

### 1. Acessibilidade dos Arquivos

Abrir cada URL no navegador:

```
https://seudominio.com/
✓ Deve carregar o app

https://seudominio.com/manifest.json
✓ Deve mostrar o JSON

https://seudominio.com/service-worker.js
✓ Deve mostrar o código JavaScript

https://seudominio.com/icon-192.png
✓ Deve mostrar o ícone

https://seudominio.com/aluno/login
✓ Deve carregar a tela de login (não 404!)

https://seudominio.com/aluno/dashboard
✓ Deve carregar o dashboard (não 404!)
```

### 2. Console do Navegador (F12)

Acessar: `https://seudominio.com/aluno/login`

**Logs esperados:**
```
[PWA] Attempting to register service worker...
[PWA] Service Worker registered successfully: /
[PWA] Registration details: {active: true, ...}
[SW] Installing service worker...
[SW] Opened cache
[SW] Cache initialized
```

**Se aparecer erro:**
- [ ] Copiar mensagem EXATA do erro
- [ ] Verificar `PWA-TROUBLESHOOTING.md`
- [ ] Anotar qual arquivo está falhando

### 3. DevTools - Application

**F12 → Application → Manifest**
- [ ] Aba "Manifest" aparece
- [ ] Nome: "Edu Sampaio - Área do Aluno"
- [ ] Ícones carregam (sem X vermelho)
- [ ] Sem mensagens de erro

**F12 → Application → Service Workers**
- [ ] service-worker.js aparece na lista
- [ ] Status: "activated and running" (verde)
- [ ] Scope: "/"
- [ ] Pode clicar em "Update" e "Unregister"

**F12 → Application → Storage**
- [ ] Cache Storage tem "edusampaio-pwa-v2"
- [ ] Dentro tem os arquivos em cache

### 4. Teste em Dispositivo Mobile

**Desktop (simulação):**
- [ ] F12 → Ctrl+Shift+M (Toggle device toolbar)
- [ ] Selecionar "iPhone 12 Pro" ou similar
- [ ] Recarregar a página
- [ ] Verificar se prompt aparece

**Mobile real (Android):**
- [ ] Abrir Chrome no celular
- [ ] Ir para `https://seudominio.com/aluno/login`
- [ ] Card de instalação deve aparecer
- [ ] Clicar em "Instalar"
- [ ] App deve ser adicionado à tela inicial

**Mobile real (iOS):**
- [ ] Abrir Safari no iPhone
- [ ] Ir para `https://seudominio.com/aluno/login`
- [ ] Card com instruções deve aparecer
- [ ] Seguir instruções para instalar

### 5. Teste de Rotas SPA

Testar acesso direto às rotas:

```
https://seudominio.com/aluno/dashboard
✓ Não deve dar 404
✓ Deve carregar o app

https://seudominio.com/cursos
✓ Não deve dar 404
✓ Deve carregar o app

https://seudominio.com/sobre
✓ Não deve dar 404
✓ Deve carregar o app
```

Se der 404, o `.htaccess` não está funcionando!

### 6. Teste Offline (após instalação)

- [ ] Abrir DevTools (F12)
- [ ] Ir para Network → marcar "Offline"
- [ ] Recarregar a página
- [ ] App deve continuar funcionando (com cache)

## ⚠️ Problemas Comuns

### ❌ 404 em service-worker.js
**Causa**: Arquivo não foi enviado ou está em lugar errado
**Solução**: Verificar se está na raiz do site

### ❌ 404 em manifest.json
**Causa**: Arquivo não foi enviado
**Solução**: Verificar se está na raiz do site

### ❌ 404 nas rotas (/aluno/dashboard)
**Causa**: `.htaccess` não foi enviado ou não está funcionando
**Solução**: 
1. Verificar se `.htaccess` está no servidor
2. Contactar suporte Locaweb para ativar `mod_rewrite`

### ❌ Service Worker não registra
**Causa**: Não está em HTTPS
**Solução**: Ativar SSL no Locaweb

### ❌ Prompt não aparece
**Causa**: Já instalado, já dismissado, ou não é mobile
**Solução**: Limpar storage e testar em aba anônima mobile

### ❌ Ícones com X vermelho
**Causa**: Arquivos de ícone não foram enviados
**Solução**: Enviar `icon-192.png` e `icon-512.png`

## 📞 Suporte Locaweb

Se precisar contactar o suporte, perguntar:

1. ✅ "O mod_rewrite do Apache está ativo na minha conta?"
2. ✅ "O arquivo .htaccess está sendo processado?"
3. ✅ "Posso modificar headers HTTP?"
4. ✅ "O SSL/HTTPS está configurado corretamente?"

## 🎯 Resultado Final

Quando tudo funcionar:

✅ Site carrega em HTTPS
✅ Todas as rotas funcionam (sem 404)
✅ Console sem erros críticos
✅ Service Worker: "activated and running"
✅ Manifest carregado corretamente
✅ Prompt aparece no mobile
✅ App instala com sucesso
✅ Funciona offline

## 📝 Template de Reporte de Problema

Se não funcionar, envie estas informações:

```
URL do site: https://_______________
Navegador: __________
Dispositivo: __________

Console (F12):
[Copiar TODOS os logs em vermelho]

DevTools → Application → Service Workers:
Status: __________
Mensagem: __________

DevTools → Application → Manifest:
[ ] Carregou OK
[ ] Erro: __________

Arquivos testados:
[ ] /manifest.json → Resultado: __________
[ ] /service-worker.js → Resultado: __________
[ ] /aluno/login → Resultado: __________

Screenshot do Console anexado: [ ]
Screenshot do Application anexado: [ ]
```

## 🚀 Próximos Passos Após Sucesso

Quando o PWA estiver funcionando:

1. **Testar em diferentes dispositivos**
   - [ ] Android (Chrome)
   - [ ] iPhone (Safari)
   - [ ] Tablet
   - [ ] Desktop

2. **Monitorar**
   - [ ] Verificar logs do servidor
   - [ ] Verificar taxa de instalação
   - [ ] Coletar feedback dos usuários

3. **Otimizar**
   - [ ] Adicionar mais recursos ao cache
   - [ ] Implementar notificações push (futuro)
   - [ ] Melhorar splash screen

---

**Preparado por**: Copilot
**Data**: Janeiro 2026
**Versão PWA**: 2.0
**Checklist Status**: Pronto para uso
