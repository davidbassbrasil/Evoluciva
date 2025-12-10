import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addToCart, getCurrentUser } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { Course } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import supabase from '@/lib/supabaseClient';

export default function CursoDetalhe() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCourse = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Tentar buscar por slug primeiro, depois por ID
        let query = supabase
          .from('courses')
          .select('*')
          .eq('active', true);

        // Verificar se é UUID (id) ou slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId || '');
        
        if (isUUID) {
          query = query.eq('id', courseId);
        } else {
          query = query.eq('slug', courseId);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        setCourse(data);
      } catch (err: any) {
        console.error('Error loading course:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Curso não encontrado</h1>
          <Link to="/cursos">
            <Button>Ver todos os cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Parse whats_included from database (accepts commas or line breaks)
  const benefits = course.whats_included 
    ? course.whats_included
        .split(/[,\n]/) // Split by comma or newline
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[•\-*]\s*/, '')) // Remove bullets if present
    : [
        "Acesso ao conteúdo do curso",
        "Certificado de conclusão",
        "Suporte com o professor",
        "Material complementar"
      ];

  const modules = [
    { title: "Módulo 1 - Introdução e Fundamentos", lessons: 8 },
    { title: "Módulo 2 - Conceitos Intermediários", lessons: 12 },
    { title: "Módulo 3 - Tópicos Avançados", lessons: 10 },
    { title: "Módulo 4 - Exercícios e Simulados", lessons: 15 },
    { title: "Módulo 5 - Revisão Final", lessons: 6 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <Link to="/cursos" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para cursos
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <div>
                <Badge variant="secondary" className="mb-4">
                  {course.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {course.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {course.description}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {course.instructor}
                  </div>
                </div>
              </div>

              {/* Course Image */}
              <div className="aspect-[5/4] rounded-2xl overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* About Course */}
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h2 className="text-2xl font-bold mb-4">Sobre o Curso</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {course.full_description ? (
                    <div className="text-muted-foreground whitespace-pre-line">
                      {course.full_description}
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-4">
                        {course.description}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        O professor {course.instructor} traz anos de experiência na preparação de candidatos, com um método didático que facilita o aprendizado mesmo dos temas mais complexos. As aulas são objetivas e focadas no que realmente cai nas provas.
                      </p>
                      <p className="text-muted-foreground">
                        Além das videoaulas, você terá acesso a material de apoio em PDF, exercícios comentados, simulados exclusivos e acesso à comunidade de alunos para tirar dúvidas e trocar experiências.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h2 className="text-2xl font-bold mb-6">O que está incluso</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Purchase Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-card rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="aspect-[5/4] rounded-xl overflow-hidden mb-6">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mb-6">
                  <span className="text-muted-foreground text-sm line-through">
                    R$ {Number(course.originalPrice || 0).toFixed(2)}
                  </span>
                  <div className="text-3xl font-bold text-primary">
                    R$ {Number(course.price || 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou 12x de R$ {(Number(course.price || 0) / 12).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      const currentUser = getCurrentUser();
                      if (!currentUser) {
                        toast({ 
                          title: 'Faça login', 
                          description: 'Você precisa estar logado para adicionar cursos ao carrinho.',
                          variant: 'destructive'
                        });
                        sessionStorage.setItem('checkout_return_path', window.location.pathname);
                        navigate('/aluno/login');
                        return;
                      }
                      addToCart(course.id);
                      toast({ title: 'Adicionado ao carrinho', description: `${course.title} foi adicionado ao carrinho.` });
                    }}
                    className="w-full gradient-bg text-primary-foreground shadow-glow hover:opacity-90 h-12 text-lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Adicionar ao carrinho
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const currentUser = getCurrentUser();
                      if (!currentUser) {
                        toast({ 
                          title: 'Faça login', 
                          description: 'Você precisa estar logado para acessar o carrinho.',
                          variant: 'destructive'
                        });
                        sessionStorage.setItem('checkout_return_path', '/cart');
                        navigate('/aluno/login');
                        return;
                      }
                      navigate('/cart');
                    }}
                  >
                    Ir para o carrinho
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Pagamento seguro
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Garantia de 7 dias
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Acesso garantido
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}