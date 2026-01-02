# PWA - Área do Aluno

## 📱 Progressive Web App (PWA) Implementado

O sistema agora conta com suporte completo a PWA, permitindo que os alunos instalem a plataforma em seus dispositivos móveis como se fosse um aplicativo nativo.

## ✨ Recursos Implementados

### 1. **Manifest.json** (`/public/manifest.json`)
- Configuração do PWA com nome, ícones e cores
- Define a URL inicial como `/aluno/dashboard`
- Modo standalone (fullscreen sem barra de navegador)
- Atalhos para áreas principais (Dashboard e Meus Cursos)
- Ícones otimizados para Android e iOS

### 2. **Service Worker** (`/public/service-worker.js`)
- Cache de recursos principais para funcionamento offline
- Estratégia cache-first com fallback para rede
- Atualização automática de cache quando nova versão disponível
- URLs em cache:
  - `/` (home)
  - `/aluno/dashboard`
  - `/aluno/login`
  - `/aluno/modulos`
  - Ícones e favicon

### 3. **Componente PWAInstallPrompt** (`/src/components/pwa/PWAInstallPrompt.tsx`)
- Detecta automaticamente dispositivos móveis
- Mostra prompt de instalação apenas em mobile
- Suporte especial para iOS com instruções manuais
- Suporte nativo para Android/Chrome
- Sistema de "não mostrar novamente" por 7 dias
- Design responsivo e não intrusivo

### 4. **Integração no Login**
- Prompt aparece automaticamente na tela de login quando acessada pelo celular
- Não aparece se o app já estiver instalado
- Não aparece se o usuário já tiver dispensado nos últimos 7 dias

## 🚀 Como Funciona

### Para o Usuário (Android)
1. Acessa `/aluno/login` pelo navegador do celular
2. Um card aparece na parte inferior da tela
3. Clica em "Instalar"
4. O app é adicionado à tela inicial
5. Abre como aplicativo nativo

### Para o Usuário (iOS)
1. Acessa `/aluno/login` pelo Safari no iPhone/iPad
2. Um card aparece com instruções passo a passo
3. Segue as instruções:
   - Toca no botão de compartilhar (⎙)
   - Seleciona "Adicionar à Tela Inicial"
   - Confirma a adição
4. O app aparece na tela inicial

### Recursos do App Instalado
- ✅ Funciona offline (recursos em cache)
- ✅ Ícone na tela inicial
- ✅ Abre em tela cheia (sem barra do navegador)
- ✅ Splash screen personalizada
- ✅ Notificações push (pode ser implementado futuramente)
- ✅ Acesso rápido via atalhos

## 📋 Checklist de Verificação

- [x] Manifest.json criado e linkado no HTML
- [x] Service Worker registrado
- [x] Meta tags PWA no index.html
- [x] Ícones nas resoluções corretas
- [x] Componente de prompt criado
- [x] Integrado na tela de login
- [x] Detecção de mobile funcional
- [x] Suporte para iOS e Android
- [x] Sistema de cache implementado

## 🔧 Configurações Técnicas

### Ícones Necessários
- `/icon-192.png` - 192x192px
- `/icon-512.png` - 512x512px
- `/apple-touch-icon.png` - 180x180px
- `/favicon.png` - 32x32px ou 48x48px

### Meta Tags Adicionadas
```html
<link rel="manifest" href="/manifest.json" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Edu Sampaio" />
<meta name="theme-color" content="#2563eb" />
```

## 🎨 Personalização

### Alterar Cores
Edite o `manifest.json`:
```json
"background_color": "#ffffff",
"theme_color": "#2563eb"
```

### Alterar URLs em Cache
Edite o array `urlsToCache` no `service-worker.js`:
```javascript
const urlsToCache = [
  '/',
  '/aluno/dashboard',
  // adicione mais URLs aqui
];
```

### Alterar Frequência de Exibição do Prompt
No arquivo `PWAInstallPrompt.tsx`, linha ~42, altere o número de dias:
```typescript
daysSinceDismissed > 7  // Altere 7 para o número de dias desejado
```

## 🧪 Como Testar

### Desenvolvimento Local
1. Build do projeto: `npm run build`
2. Servir localmente: `npm run preview`
3. Abrir no Chrome DevTools:
   - F12 → Application → Manifest
   - F12 → Application → Service Workers
4. Testar instalação:
   - Chrome: Menu → Install App
   - Mobile: Acessar via navegador

### Testar em Dispositivo Real
1. Deploy da aplicação
2. Acessar pelo celular via HTTPS (obrigatório para PWA)
3. Ir para `/aluno/login`
4. Verificar se o prompt aparece
5. Testar instalação

## ⚠️ Requisitos Importantes

- **HTTPS obrigatório**: PWA só funciona em HTTPS (exceto localhost)
- **Ícones**: Certifique-se de que todos os ícones existem em `/public`
- **Service Worker**: Precisa estar em `/public` para funcionar corretamente
- **Cache**: Limpe o cache do navegador ao testar mudanças no service worker

## 📱 Comportamento Esperado

### Quando Mostrar o Prompt
- ✅ Primeira visita em mobile
- ✅ Após 7 dias de ter dispensado
- ✅ Apenas em dispositivos móveis
- ✅ Apenas se não estiver instalado

### Quando NÃO Mostrar
- ❌ Desktop/notebook
- ❌ App já instalado
- ❌ Dispensado há menos de 7 dias
- ❌ Usando o app instalado

## 🔄 Atualizações Futuras

Possíveis melhorias:
- [ ] Notificações push
- [ ] Sincronização em background
- [ ] Compartilhamento nativo
- [ ] Geolocalização
- [ ] Acesso à câmera para upload de documentos
- [ ] Modo offline avançado com sincronização

## 📞 Suporte

Se o prompt não aparecer, verifique:
1. Está acessando de um dispositivo móvel?
2. O site está em HTTPS?
3. O service worker está registrado? (DevTools → Application)
4. Os ícones existem em `/public`?
5. Já dispensou o prompt nos últimos 7 dias?

---

**Implementado em**: Janeiro 2026  
**Compatibilidade**: Chrome, Safari, Edge, Firefox (mobile e desktop)
