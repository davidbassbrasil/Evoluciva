# 🚨 PWA Debug - O que fazer se "não funcionou"

Se o PWA ainda não está funcionando, é provável que seja um problema de ambiente (HTTPS, Servidor) ou cache.

## 🛠️ Novas Ferramentas Criadas

### 1. Página de Debug (`/aluno/pwa-debug`)
Acesse `https://seudominio.com/aluno/pwa-debug` no seu celular ou computador.
Esta página vai te mostrar EXATAMENTE o que está errado:
- 🔴 Se HTTPS está faltando
- 🔴 Se o Service Worker não é suportado
- 🔴 Se o Manifest falhou ao carregar
- 🔴 Se o evento de instalação foi disparado

### 2. Suporte a Windows Server (IIS)
Adicionei o arquivo `web.config` na pasta `dist/`.
Se o seu plano Locaweb for Windows, este arquivo é **essencial**.

### 3. Logs Detalhados
O componente de instalação agora diz no console POR QUE não apareceu:
- "Not showing because: notMobile"
- "Not showing because: dismissedRecently"
- "Showing Android prompt"

## 📋 Checklist de Upload (Atualizado)

Ao fazer upload para o Locaweb, certifique-se de enviar:

1. **`web.config`** (NOVO - para servidores Windows)
2. **`.htaccess`** (para servidores Linux)
3. **`manifest.json`**
4. **`service-worker.js`**
5. **Pasta `assets/` completa**

## 🔍 Como Testar Agora

1. **Upload**: Envie a nova pasta `dist/` para o servidor.
2. **Acesse**: `https://seudominio.com/aluno/pwa-debug`
3. **Verifique**:
   - Todos os ícones devem estar VERDES ✅
   - Se algum estiver VERMELHO 🔴, leia a mensagem de erro.

## ❓ Problemas Comuns e Soluções

### "HTTPS" está vermelho 🔴
**Causa**: Você está acessando por `http://`.
**Solução**: Use `https://` na URL. Se não funcionar, ative o SSL no painel da Locaweb.

### "Manifest" está vermelho 🔴
**Causa**: O arquivo `manifest.json` não está na raiz ou o servidor bloqueou o tipo de arquivo.
**Solução**: Verifique se `manifest.json` está na pasta pública do servidor. Se for Windows, o `web.config` que criei resolve isso.

### "Service Worker" está amarelo ⚠️
**Causa**: O navegador suporta, mas não conseguiu registrar.
**Solução**: Clique no botão "Try Register Manual" na página de debug e veja o erro no log abaixo.

### "Install Prompt Event" está amarelo ⚠️
**Causa**: O navegador não disparou o evento.
**Motivos comuns**:
- Já está instalado
- Não houve interação do usuário (clique na página)
- O navegador decidiu não mostrar (critérios internos do Chrome)
- Você está no Desktop (não mobile)

## 📱 Dica para Mobile

Se você não consegue ver o console no celular:
1. Acesse `/aluno/pwa-debug`
2. Veja a seção "Logs" na parte inferior
3. Tire um print e analise (ou me mande o texto)

---

**Versão**: 2.1 (Debug Edition)
**Build**: ✅ Sucesso
