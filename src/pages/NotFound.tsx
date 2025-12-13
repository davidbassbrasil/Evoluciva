import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="404 - Página Não Encontrada"
        description="A página que você está procurando não existe ou foi movida. Volte para a página inicial do Eduardo Sampaio Cursos."
        noindex={true}
      />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="text-center px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
          <div className="h-1 w-32 gradient-bg mx-auto rounded-full mb-6"></div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Página Não Encontrada
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Ops! A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="gradient-bg text-primary-foreground gap-2"
          >
            <Home className="w-4 h-4" />
            Ir para o Início
          </Button>
        </div>
        
        <div className="mt-12 text-sm text-muted-foreground">
          <p>Precisa de ajuda? Entre em contato conosco.</p>
        </div>
      </div>
      </div>
    </>
  );
};

export default NotFound;
