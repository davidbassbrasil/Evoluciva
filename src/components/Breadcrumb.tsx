import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useEffect } from 'react';
import { getBreadcrumbSchema, injectSchema } from '@/lib/schemas';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Componente Breadcrumb com Schema.org para SEO
 * Melhora navegação e aparece nos resultados do Google
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  useEffect(() => {
    // Gerar schema de breadcrumb
    const schemaItems = [
      { name: 'Início', url: window.location.origin },
      ...items.filter(item => item.href).map(item => ({
        name: item.label,
        url: `${window.location.origin}${item.href}`
      }))
    ];

    const schema = getBreadcrumbSchema(schemaItems);
    injectSchema(schema);
  }, [items]);

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Link 
        to="/" 
        className="hover:text-foreground transition-colors flex items-center gap-1"
        aria-label="Voltar para página inicial"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Início</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          {item.href && index < items.length - 1 ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
