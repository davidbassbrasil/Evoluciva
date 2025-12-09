import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, User, CheckCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCourses, addToCart } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { Course } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';

export default function CursoDetalhe() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const courses = getCourses();
    const found = courses.find(c => c.id === courseId);
    setCourse(found || null);
  }, [courseId]);

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

  const benefits = [
    "Acesso vitalício ao conteúdo",
    "Certificado de conclusão",
    "Suporte direto com o professor",
    "Material complementar em PDF",
    "Atualizações gratuitas",
    "Comunidade exclusiva de alunos",
    "Simulados e exercícios práticos",
    "Garantia de 7 dias"
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
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {course.lessons} aulas
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
                  <p className="text-muted-foreground mb-4">
                    Este curso foi desenvolvido especialmente para você que deseja se preparar de forma completa e eficiente para os concursos públicos mais disputados do país. Com uma metodologia comprovada e materiais atualizados, você terá acesso a todo o conteúdo necessário para alcançar a aprovação.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    O professor {course.instructor} traz anos de experiência na preparação de candidatos, com um método didático que facilita o aprendizado mesmo dos temas mais complexos. As aulas são objetivas e focadas no que realmente cai nas provas.
                  </p>
                  <p className="text-muted-foreground">
                    Além das videoaulas, você terá acesso a material de apoio em PDF, exercícios comentados, simulados exclusivos e acesso à comunidade de alunos para tirar dúvidas e trocar experiências.
                  </p>
                </div>
              </div>

              {/* Course Content */}
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h2 className="text-2xl font-bold mb-6">Conteúdo do Curso</h2>
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
                    >
                      <span className="font-medium">{module.title}</span>
                      <span className="text-sm text-muted-foreground">{module.lessons} aulas</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Total: {modules.reduce((acc, m) => acc + m.lessons, 0)} aulas
                </p>
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
                    R$ {course.originalPrice.toFixed(2)}
                  </span>
                  <div className="text-3xl font-bold text-primary">
                    R$ {course.price.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou 12x de R$ {(course.price / 12).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      addToCart(course.id);
                      toast({ title: 'Adicionado ao carrinho', description: `${course.title} foi adicionado ao carrinho.` });
                    }}
                    className="w-full block"
                  >
                    <Button className="w-full gradient-bg text-primary-foreground shadow-glow hover:opacity-90 h-12 text-lg">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Adicionar ao carrinho
                    </Button>
                  </button>

                  <Link to="/cart" className="block">
                    <Button variant="outline" className="w-full">Ir para o carrinho</Button>
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Acesso imediato
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Garantia de 7 dias
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Pagamento seguro
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