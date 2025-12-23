import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
}

/**
 * Componente SEO Head - Gerencia meta tags de forma centralizada
 * Otimiza títulos, descrições, Open Graph e Twitter Cards
 */
export function SEOHead({
  title,
  description,
  keywords,
  image,
  type = 'website',
  canonical,
  noindex = false
}: SEOProps) {
  const location = useLocation();
  const currentUrl = `${window.location.origin}${location.pathname}`;
  
  // Adicionar nome da marca ao título se não estiver presente
  const fullTitle = title.includes('Eduardo Sampaio') || title.includes('Edu Sampaio')
    ? title
    : `${title} | Edu Sampaio Cursos`;
  
  // Imagem padrão se não fornecida. Se for caminho relativo, prefixar com origin para gerar URL absoluta
  const ogImage = image
    ? (image.startsWith('http') ? image : `${window.location.origin}${image}`)
    : `${window.location.origin}/logo_.png`;
  
  // URL canônica
  const canonicalUrl = canonical || currentUrl;

  useEffect(() => {
    // Atualizar título
    document.title = fullTitle;

    // Atualizar meta description
    updateMetaTag('name', 'description', description);

    // Atualizar keywords se fornecido
    if (keywords) {
      updateMetaTag('name', 'keywords', keywords);
    }

    // Atualizar meta robots
    if (noindex) {
      updateMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      updateMetaTag('name', 'robots', 'index, follow');
    }

    // Open Graph tags
    updateMetaTag('property', 'og:title', fullTitle);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:url', currentUrl);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:alt', title);
    updateMetaTag('property', 'og:site_name', 'Edu Sampaio Cursos');
    updateMetaTag('property', 'og:locale', 'pt_BR');

    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', fullTitle);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);
    updateMetaTag('name', 'twitter:image:alt', title);

    // Link canônico
    updateCanonical(canonicalUrl);

    // Limpar ao desmontar não é necessário pois será sobrescrito na próxima página
  }, [fullTitle, description, keywords, type, currentUrl, ogImage, canonicalUrl, noindex]);

  return null; // Este componente não renderiza nada
}

/**
 * Helper para atualizar ou criar meta tags
 */
function updateMetaTag(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  
  element.content = value;
}

/**
 * Helper para atualizar ou criar link canônico
 */
function updateCanonical(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  
  canonical.href = url;
}

/**
 * Hook personalizado para usar SEO de forma mais simples
 */
export function useSEO(props: SEOProps) {
  return SEOHead(props);
}

/**
 * Funções helper para gerar títulos e descrições otimizados
 */
export const seoHelpers = {
  // Gera título otimizado com limite de caracteres
  generateTitle: (baseTitle: string, maxLength = 60): string => {
    const suffix = ' | Edu Sampaio Cursos';
    const fullTitle = baseTitle.includes('Eduardo Sampaio') || baseTitle.includes('Edu Sampaio')
      ? baseTitle
      : baseTitle + suffix;
    
    return fullTitle.length > maxLength
      ? fullTitle.substring(0, maxLength - 3) + '...'
      : fullTitle;
  },

  // Gera descrição otimizada com limite de caracteres
  generateDescription: (text: string, maxLength = 160): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  // Remove HTML tags de string
  stripHtml: (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
};
