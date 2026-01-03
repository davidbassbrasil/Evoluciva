import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function FullscreenMobile() {
  const location = useLocation();

  useEffect(() => {
    // Verificar se está em mobile
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );

    // Verificar se está na área do aluno
    const isStudentArea = location.pathname.startsWith('/aluno');

    // Só ativar fullscreen em mobile e na área do aluno
    if (!isMobile || !isStudentArea) {
      return;
    }

    console.log('[Fullscreen] Tentando ativar fullscreen para área do aluno em mobile');

    // Função para entrar em fullscreen
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          console.log('[Fullscreen] Fullscreen ativado');
        } else if ((elem as any).webkitRequestFullscreen) {
          // Safari
          await (elem as any).webkitRequestFullscreen();
          console.log('[Fullscreen] Fullscreen ativado (webkit)');
        } else if ((elem as any).mozRequestFullScreen) {
          // Firefox
          await (elem as any).mozRequestFullScreen();
          console.log('[Fullscreen] Fullscreen ativado (moz)');
        } else if ((elem as any).msRequestFullscreen) {
          // IE/Edge
          await (elem as any).msRequestFullscreen();
          console.log('[Fullscreen] Fullscreen ativado (ms)');
        }
      } catch (error) {
        console.log('[Fullscreen] Erro ao ativar fullscreen:', error);
      }
    };

    // Listener para detectar quando sai do fullscreen
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      console.log('[Fullscreen] Estado mudou:', isFullscreen ? 'ativo' : 'inativo');

      // Se saiu do fullscreen e ainda está na área do aluno, tentar voltar
      if (!isFullscreen && isStudentArea && isMobile) {
        console.log('[Fullscreen] Tentando reativar fullscreen...');
        // Usar setTimeout para evitar problemas com o evento
        setTimeout(() => {
          enterFullscreen();
        }, 500);
      }
    };

    // Adicionar listeners para mudanças de fullscreen
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Tentar entrar em fullscreen após um pequeno delay
    // (necessário para permitir interação do usuário)
    const timer = setTimeout(() => {
      enterFullscreen();
    }, 500);

    // Cleanup
    return () => {
      clearTimeout(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);

      // Sair do fullscreen quando sair da área do aluno
      if (!isStudentArea) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozFullScreenElement) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msFullscreenElement) {
          (document as any).msExitFullscreen();
        }
      }
    };
  }, [location.pathname]);

  return null;
}
