# 🧪 Guia Rápido de Teste do PWA

## Testar Localmente (Desenvolvimento)

### 1. Executar o projeto
```powershell
npm run dev
```

### 2. Testar no Chrome Desktop
1. Abra: http://localhost:8080/aluno/login
2. Abra DevTools (F12)
3. Vá em **Application** → **Manifest**
4. Verifique se o manifest.json carregou corretamente
5. Vá em **Service Workers**
6. Verifique se o service worker foi registrado

### 3. Simular Mobile no Chrome
1. DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
2. Selecione um dispositivo mobile (ex: iPhone 12 Pro)
3. Acesse: http://localhost:8080/aluno/login
4. O prompt de instalação deve aparecer na parte inferior

### 4. Testar Instalação no Desktop
1. No Chrome, clique nos 3 pontos no canto superior direito
2. Procure por "Instalar Edu Sampaio..."
3. Clique para instalar
4. O app abrirá em uma janela separada

## Testar em Dispositivo Real

### Android (Chrome/Edge)

#### Via USB (Debugging)
```powershell
# 1. Buildar o projeto
npm run build

# 2. Servir localmente
npm run preview

# 3. Usar ferramentas como ngrok para expor via HTTPS
# ou deploy temporário
```

#### Via Deploy
1. Faça deploy da aplicação (Vercel, Netlify, etc.)
2. Acesse a URL via celular: `https://seusite.com/aluno/login`
3. O prompt deve aparecer automaticamente
4. Clique em "Instalar"
5. Aceite a instalação
6. O app será adicionado à tela inicial

### iOS (Safari)

1. Acesse via Safari: `https://seusite.com/aluno/login`
2. O prompt aparecerá com instruções
3. Siga os passos:
   - Toque no botão de compartilhar (⎙)
   - Role para baixo
   - Toque em "Adicionar à Tela Inicial"
   - Confirme tocando em "Adicionar"

## Verificar Funcionalidades

### Cache Offline
1. Instale o app
2. Abra o app instalado
3. Navegue pelas páginas em cache
4. Ative o modo avião
5. Tente acessar as páginas novamente
6. Elas devem carregar do cache

### Atualização do Service Worker
1. Faça uma alteração no service-worker.js
2. Faça build e deploy
3. Abra o app instalado
4. Um prompt deve aparecer perguntando se quer atualizar
5. Aceite e a página recarregará

## Comandos Úteis

### Limpar Cache do Service Worker
```javascript
// No Console do DevTools
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

### Limpar todo o storage
```javascript
// No Console do DevTools
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Verificar se está instalado
```javascript
// No Console
window.matchMedia('(display-mode: standalone)').matches
// true = instalado, false = navegador
```

## Checklist de Testes

- [ ] Manifest.json carrega corretamente
- [ ] Service worker registra sem erros
- [ ] Prompt aparece em mobile
- [ ] Prompt não aparece em desktop
- [ ] Instalação funciona no Android
- [ ] Instalação funciona no iOS
- [ ] App abre em fullscreen
- [ ] Ícone aparece na tela inicial
- [ ] Cache offline funciona
- [ ] Atualização do SW funciona
- [ ] Prompt não aparece se já instalado
- [ ] Botão "Agora não" funciona
- [ ] Prompt não aparece por 7 dias após dispensar

## Problemas Comuns

### Prompt não aparece
- Verifique se está em mobile (ou simulando)
- Verifique se está em HTTPS (obrigatório em produção)
- Limpe o localStorage: `localStorage.removeItem('pwa-install-dismissed')`
- Verifique se já está instalado

### Service Worker não registra
- Certifique-se de que o arquivo está em `/public`
- Verifique o console por erros
- Tente desregistrar e recarregar

### Ícones não aparecem
- Verifique se os arquivos existem em `/public`
- Verifique os caminhos no manifest.json
- Limpe o cache e recarregue

### App não funciona offline
- Verifique se as URLs estão no cache
- Veja o console do service worker
- Tente adicionar mais URLs ao cache

## DevTools - Atalhos Importantes

- **F12** - Abrir DevTools
- **Ctrl+Shift+M** - Toggle device toolbar (mobile)
- **Ctrl+Shift+R** - Hard reload (ignora cache)
- **Ctrl+Shift+Del** - Limpar dados

## Links Úteis

- [Chrome DevTools PWA](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)

---

**Dica Pro**: Use o Chrome DevTools → Application → Manifest para gerar um relatório completo do seu PWA!
