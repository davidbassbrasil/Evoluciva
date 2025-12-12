import { Award, Users, BookOpen, Target, Heart, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import eduSobreImg from '@/assets/edusobre.jpg';
import institucionalImg from '@/assets/institucional.jpg';

export default function Sobre() {
  const values = [
    {
      icon: Target,
      title: "Foco no Resultado",
      description: "Nossa metodologia é 100% voltada para a aprovação. Cada aula, exercício e material é pensado para maximizar suas chances de sucesso."
    },
    {
      icon: Heart,
      title: "Compromisso com o Aluno",
      description: "Tratamos cada aluno de forma única, oferecendo suporte personalizado e acompanhamento durante toda a jornada de preparação."
    },
    {
      icon: Lightbulb,
      title: "Inovação Constante",
      description: "Estamos sempre atualizando nossos métodos e materiais para acompanhar as mudanças nos concursos públicos."
    },
  ];

  const team = [
    {
      name: "Prof. Eduardo Sampaio",
      role: "Fundador e Diretor",
      image: eduSobreImg,
      bio: "Prof. de Português e Redação com mais de 20 anos de experiência em preparação para concursos."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <section className="container mx-auto px-4 mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-6">Nossa História</h1>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Com mais de 20 anos de atuação, o Edu Sampaio Cursos consolidou-se como uma das instituições de preparação para concursos mais tradicionais de Alagoas. Fundado pelo professor Eduardo Sampaio, especialista em Língua Portuguesa, o curso nasceu com o compromisso de oferecer ensino de qualidade e direcionamento real para quem busca aprovação no serviço público.
                </p>
                <p>
                  Ao longo de sua trajetória, o Edu Sampaio Cursos evoluiu de turmas presenciais em Maceió para uma estrutura moderna, com aulas presenciais e transmissões ao vivo, materiais próprios, atendimento próximo ao aluno e uma equipe de professores experientes em áreas como Educação, Saúde, Legislação, RLM e Conhecimentos Pedagógicos.
                </p>
                <p>
                  O resultado dessa caminhada é uma comunidade reconhecida pela disciplina, pelo suporte ao aluno e pelo foco em resultados — a nossa Academia de Vencedores. Hoje, seguimos firmes na mesma missão que nos acompanha desde o início: transformar dedicação em aprovação e abrir caminhos para novas conquistas.
                </p>
              </div>
            </div>
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img
                  src={institucionalImg}
                  alt="Institucional"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">
              O que nos guia
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 border border-border/50 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-6">
                  <value.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Conheça quem faz acontecer
            </h2>
          </div>
          <div className="max-w-md mx-auto">
            {team.map((member, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}