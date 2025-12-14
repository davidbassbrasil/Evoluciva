import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Professor } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import supabase from '@/lib/supabaseClient';

export default function ProfessorDetalhe() {
  const { professorId } = useParams();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessor();
  }, [professorId]);

  const loadProfessor = async () => {
    if (!supabase || !professorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Verificar se é slug ou UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(professorId);
      
      // Buscar professor
      let query = supabase
        .from('professors')
        .select('*');

      if (isUUID) {
        query = query.eq('id', professorId);
      } else {
        query = query.eq('slug', professorId);
      }

      const { data: professorData, error: professorError } = await query.single();

      if (professorError) throw professorError;

      // Buscar cursos vinculados
      const { data: relationsData } = await supabase
        .from('professor_courses')
        .select(`
          course:courses(id, title, slug, image, description, instructor)
        `)
        .eq('professor_id', professorData.id);

      const courses = relationsData?.map(rel => rel.course).filter(Boolean) || [];

      setProfessor({
        ...professorData,
        courses
      });
    } catch (err) {
      console.error('Error loading professor:', err);
      setProfessor(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <FloatingNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <GraduationCap className="w-16 h-16 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!professor) {
    return (
      <>
        <FloatingNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Professor não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              O professor que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => navigate('/')} className="gradient-bg text-primary-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a Home
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <FloatingNav />
      
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Botão Voltar */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>

          {/* Header do Professor */}
          <div className="bg-card rounded-3xl border border-border/50 overflow-hidden mb-8">
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Foto */}
                <div className="flex-shrink-0">
                  <img
                    src={professor.image}
                    alt={professor.name}
                    className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover border-4 border-primary/20"
                  />
                </div>

                {/* Informações */}
                <div className="flex-1">
                  {professor.name !== '' && (
                    <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                      
                    </Badge>
                  )}
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">
                    {professor.name}
                  </h1>
                  <p className="text-xl text-primary font-semibold mb-4">
                    {professor.specialty}
                  </p>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {professor.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cursos do Professor */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              
              <h2 className="text-2xl md:text-2xl font-bold">
                Cursos ministrados por {professor.name}
              </h2>
            </div>

            {professor.courses && professor.courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professor.courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/curso/${course.slug || course.id}`}
                    className="group"
                  >
                    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover-lift">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {course.description}
                          </p>
                        )}
                        <Button size="sm" className="w-full gradient-bg text-primary-foreground shadow-glow hover:opacity-90">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Nenhum curso disponível</h3>
                <p className="text-muted-foreground mb-6">
                  Este professor faz parte da nossa equipe, mas não possui cursos exclusivos no momento.
                </p>
                <Link to="/cursos">
                  <Button className="gradient-bg text-primary-foreground">
                    Ver Todos os Cursos
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
