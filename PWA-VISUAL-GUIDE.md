# 📸 Como o PWA Aparece para o Usuário

## 🎨 Interface do Prompt de Instalação

### Android / Chrome
```
┌─────────────────────────────────────────┐
│  📱 Card de Instalação                  │
│  (Aparece na parte inferior da tela)    │
├─────────────────────────────────────────┤
│                                         │
│  [📥]  Instalar Edu Sampaio             │
│                                         │
│  Instale o app para acesso rápido       │
│  e experiência completa, mesmo offline. │
│                                         │
│  [ Instalar ]  [ Agora não ]      [✕]   │
│                                         │
└─────────────────────────────────────────┘
```

### iOS / Safari
```
┌─────────────────────────────────────────┐
│  📱 Card de Instalação                  │
│  (Aparece na parte inferior da tela)    │
├─────────────────────────────────────────┤
│                                         │
│  [📥]  Instalar Edu Sampaio             │
│                                         │
│  Para instalar este app no seu          │
│  iPhone/iPad:                           │
│                                         │
│  1. Toque no botão de compartilhar ⎙    │
│  2. Role e toque em "Adicionar à        │
│     Tela Inicial"                       │
│  3. Toque em "Adicionar" no canto       │
│     superior                            │
│                                         │
│           [ Entendi ]              [✕]   │
│                                         │
└─────────────────────────────────────────┘
```

## 📱 Fluxo de Instalação

### Passo 1: Usuário acessa /aluno/login no celular
```
┌─────────────────────────────────┐
│  Edu Sampaio - Login            │
├─────────────────────────────────┤
│                                 │
│  [Logo]                         │
│                                 │
│  Área do Aluno                  │
│                                 │
│  Email: [____________]          │
│  Senha: [____________]          │
│                                 │
│  [ Entrar ]                     │
│                                 │
│  Não tem conta? Cadastre-se     │
│                                 │
├─────────────────────────────────┤
│  ⬇️ PROMPT APARECE AQUI ⬇️      │
│  [Card de Instalação]           │
└─────────────────────────────────┘
```

### Passo 2: Usuário clica em "Instalar" (Android)
```
┌─────────────────────────────────┐
│  Adicionar à tela inicial?      │
├─────────────────────────────────┤
│                                 │
│  [Ícone] Edu Sampaio            │
│                                 │
│  edusampaio.com                 │
│                                 │
│  [ Cancelar ]  [ Adicionar ]    │
│                                 │
└─────────────────────────────────┘
```

### Passo 3: App instalado na tela inicial
```
Tela Inicial do Celular
┌─────────────────────────────────┐
│                                 │
│  [📱]     [📷]     [⚙️]         │
│  WhatsApp Camera  Config        │
│                                 │
│  [🎓]     [📧]     [🌐]         │
│  Edu      Gmail    Chrome       │
│  Sampaio                        │
│  👆 NOVO!                       │
│                                 │
└─────────────────────────────────┘
```

### Passo 4: Usuário abre o app instalado
```
┌─────────────────────────────────┐
│  Edu Sampaio - Dashboard        │
│  (Tela cheia, sem barra)        │
├─────────────────────────────────┤
│                                 │
│  Bem-vindo, João!               │
│                                 │
│  Seus Cursos                    │
│  ┌─────────────────────┐        │
│  │ Curso 1             │        │
│  │ [Progress: 45%]     │        │
│  └─────────────────────┘        │
│                                 │
│  ┌─────────────────────┐        │
│  │ Curso 2             │        │
│  │ [Progress: 20%]     │        │
│  └─────────────────────┘        │
│                                 │
└─────────────────────────────────┘
```

## 🎯 Características Visuais

### Card do Prompt
- **Posição**: Inferior da tela (fixo)
- **Cor de fundo**: Branco (modo claro) / Escuro (modo escuro)
- **Borda**: Borda azul sutil (`border-primary/20`)
- **Sombra**: Shadow-lg para destaque
- **Animação**: Slide-in suave de baixo para cima
- **Ícone**: 📥 Download com fundo azul claro
- **Botões**: 
  - Instalar: Azul primário, destaque
  - Agora não: Ghost, discreto
  - Fechar (X): Canto superior direito

### App Instalado
- **Ícone**: `/icon-512.png` (192x192 e 512x512)
- **Nome**: "Edu Sampaio" (curto) ou "Edu Sampaio - Área do Aluno" (longo)
- **Tema**: Azul (#2563eb)
- **Modo**: Standalone (tela cheia)
- **Orientação**: Portrait (retrato)
- **Splash**: Logo + nome + cor de fundo

## 📐 Dimensões

### Ícones
- **icon-192.png**: 192x192 pixels
- **icon-512.png**: 512x512 pixels  
- **apple-touch-icon.png**: 180x180 pixels
- **favicon.png**: 32x32 ou 48x48 pixels

### Card do Prompt
- **Largura**: 100% mobile, max-w-md desktop
- **Altura**: Auto (conteúdo)
- **Padding**: 1rem (16px)
- **Gap**: 0.75rem (12px) entre elementos

## 🎨 Paleta de Cores

```css
/* Cores do PWA */
--primary: #2563eb (Azul principal)
--primary-foreground: #ffffff (Texto em botões)
--background: #ffffff (Fundo)
--card: #ffffff (Fundo do card)
--border: #e5e7eb (Bordas)
--muted-foreground: #6b7280 (Texto secundário)
```

## 💡 Estados do Prompt

### Estado 1: Aparece automaticamente
- Primeira visita em mobile
- Não instalado
- Não dispensado recentemente

### Estado 2: Dismissed (dispensado)
- Usuário clicou em "Agora não" ou "X"
- Não aparece por 7 dias
- Salvo em localStorage

### Estado 3: Instalado
- App já instalado
- Prompt não aparece mais
- Detecta via `display-mode: standalone`

### Estado 4: Desktop
- Não é mobile
- Prompt não aparece
- Instalação ainda possível via menu do navegador

## 📊 Fluxograma de Decisão

```
Usuário acessa /aluno/login
         │
         ├─ É desktop? ──────→ Não mostrar prompt
         │                     (Instalação via menu)
         │
         ├─ É mobile? ─────────┐
                               │
         ┌─────────────────────┘
         │
         ├─ Já instalado? ────→ Não mostrar prompt
         │
         ├─ Dismissado < 7d? ─→ Não mostrar prompt
         │
         └─ MOSTRAR PROMPT! ───→ Android: Botão instalar
                                 iOS: Instruções manuais
```

## 🖼️ Exemplo de Código HTML Renderizado

```html
<!-- Card do Prompt (Android) -->
<div class="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
  <div class="shadow-lg border-2 border-primary/20 rounded-lg bg-card">
    <div class="p-4">
      <div class="flex items-start gap-3">
        <!-- Ícone -->
        <div class="flex-shrink-0 mt-1">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download class="w-5 h-5 text-primary" />
          </div>
        </div>
        
        <!-- Conteúdo -->
        <div class="flex-1">
          <h3 class="font-semibold text-sm mb-1">
            Instalar Edu Sampaio
          </h3>
          <p class="text-xs text-muted-foreground mb-3">
            Instale o app para acesso rápido e experiência completa, mesmo offline.
          </p>
          <div class="flex gap-2">
            <button class="btn-primary">Instalar</button>
            <button class="btn-ghost">Agora não</button>
          </div>
        </div>

        <!-- Botão fechar -->
        <button class="text-muted-foreground">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</div>
```

## 📱 Screenshots Sugeridos (para documentação interna)

1. **Tela de Login com Prompt** (Android)
2. **Tela de Login com Prompt** (iOS)
3. **Dialog de Instalação Nativo** (Android)
4. **Ícone na Tela Inicial**
5. **App Aberto em Modo Standalone**
6. **Dashboard Funcionando Offline**

---

**Nota**: Este é um guia visual/conceitual. Para ver o resultado real, acesse a aplicação em um dispositivo mobile ou use o DevTools do Chrome para simular.
