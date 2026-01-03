import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  // PWA DESATIVADO - Retorna null para não renderizar nada
  return null;
}

/* CÓDIGO ORIGINAL COMENTADO
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    console.log('[PWA] Component mounted');
    
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    setIsIOS(ios);

    // Check if already installed (running in standalone mode)
    const isStandaloneMode = () => {
      const nav = window.navigator as any;
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        nav.standalone === true ||
        document.referrer.includes('android-app://');
      return standalone;
    };

    const standalone = isStandaloneMode();
    setIsStandalone(standalone);

    console.log('[PWA] Device info:', { 
      ios, 
      isAndroid, 
      isMobile, 
      standalone,
      userAgent 
    });

    // If already installed, don't show anything
    if (standalone) {
      console.log('[PWA] App is already installed (standalone mode)');
      return;
    }

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate 
      ? Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    console.log('[PWA] Dismissed info:', { dismissedDate, daysSinceDismissed });

    // Check if should show (not dismissed recently)
    const shouldShow = !dismissedDate || (daysSinceDismissed && daysSinceDismissed > 7);
    
    if (!shouldShow) {
      console.log('[PWA] Not showing - dismissed recently');
      return;
    }

    // Function to handle the beforeinstallprompt event
    const handlePromptEvent = (e: Event) => {
      console.log('[PWA] handlePromptEvent called');
      e.preventDefault();
      
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setShowPrompt(true);
      console.log('[PWA] Showing install prompt with native event');
    };

    // Check if event was already captured globally
    if (window.deferredPrompt) {
      console.log('[PWA] Found existing global deferredPrompt, using it');
      handlePromptEvent(window.deferredPrompt);
    }

    // Listen for the custom event dispatched from index.html
    const handleCustomEvent = () => {
      console.log('[PWA] Custom pwa-prompt-ready event received');
      if (window.deferredPrompt) {
        handlePromptEvent(window.deferredPrompt);
      }
    };
    window.addEventListener('pwa-prompt-ready', handleCustomEvent);

    // Also listen for the native event (backup)
    window.addEventListener('beforeinstallprompt', handlePromptEvent);

    // For iOS - always show instructions (iOS doesn't support programmatic install)
    if (ios && isMobile && shouldShow) {
      console.log('[PWA] iOS detected - showing manual instructions');
      setShowPrompt(true);
    }

    // For Android - wait a bit and if no event came, show it anyway with fallback
    let fallbackTimer: NodeJS.Timeout | null = null;
    if (isAndroid && isMobile && !standalone && shouldShow) {
      console.log('[PWA] Android detected - setting 5 second fallback timer');
      fallbackTimer = setTimeout(() => {
        if (!deferredPrompt && !window.deferredPrompt) {
          console.log('[PWA] Android fallback: No native event after 5s, showing prompt anyway');
          setShowPrompt(true);
        } else {
          console.log('[PWA] Android fallback: Native event found, not showing fallback');
        }
      }, 5000);
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed event fired');
      setShowPrompt(false);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handlePromptEvent);
      window.removeEventListener('pwa-prompt-ready', handleCustomEvent);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('[PWA] Install button clicked');
    console.log('[PWA] deferredPrompt:', deferredPrompt);
    console.log('[PWA] window.deferredPrompt:', window.deferredPrompt);
    
    const promptToUse = deferredPrompt || window.deferredPrompt;
    
    if (!promptToUse) {
      console.log('[PWA] No deferred prompt available, showing fallback instructions');
      alert('Para instalar:\n\n1. Toque no menu do navegador (⋮)\n2. Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"');
      return;
    }

    try {
      console.log('[PWA] Calling prompt()...');
      await promptToUse.prompt();
      
      console.log('[PWA] Waiting for user choice...');
      const { outcome } = await promptToUse.userChoice;
      
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted installation');
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
      } else {
        console.log('[PWA] User dismissed installation');
      }
      
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Error during installation:', error);
      alert('Erro ao instalar. Tente: Menu do navegador (⋮) > Instalar aplicativo');
    }
  };

  const handleDismiss = () => {
    console.log('[PWA] User dismissed prompt');
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if user hasn't been prompted yet
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:max-w-md">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Instalar Edu Sampaio
              </h3>
              
              {isIOS ? (
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    Para instalar este app no seu iPhone/iPad:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Toque no botão de compartilhar <span className="inline-block">⎙</span></li>
                    <li>Role e toque em "Adicionar à Tela Inicial"</li>
                    <li>Toque em "Adicionar" no canto superior</li>
                  </ol>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">
                  Instale o app para acesso rápido e experiência completa, mesmo offline.
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {!isIOS && (
                  <Button 
                    size="sm" 
                    onClick={handleInstallClick}
                    className="text-xs h-8"
                  >
                    Instalar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="text-xs h-8"
                >
                  {isIOS ? 'Entendi' : 'Agora não'}
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
*/
