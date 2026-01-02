import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('[PWA] Attempting to register service worker...');
    
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);
        console.log('[PWA] Registration details:', {
          active: !!registration.active,
          installing: !!registration.installing,
          waiting: !!registration.waiting
        });
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] Update found!');
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[PWA] Service worker state:', newWorker.state);
              
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker available');
                // Optionally notify user about update
                if (confirm('Nova versão disponível! Deseja atualizar?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
        console.error('[PWA] Error details:', {
          message: error.message,
          stack: error.stack
        });
      });

    // Reload page when new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

