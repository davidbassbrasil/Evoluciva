import { Award, Users, BookOpen, Target, Heart, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';

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
      name: "Prof. Ricardo Mendes",
      role: "Fundador e Diretor",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
      bio: "Ex-servidor público federal com 20 anos de experiência em preparação para concursos."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium">
              Nossa História
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Transformando vidas através da <span className="gradient-text">educação</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Desde 2009, o ConcursaPlus tem sido referência em preparação para concursos públicos, 
              ajudando milhares de pessoas a conquistarem a estabilidade e qualidade de vida que merecem.
            </p>
          </div>
        </section>


        {/* Our Story */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                Como Começamos
              </Badge>
              <h2 className="text-3xl font-bold mb-6">
                Uma história de dedicação e resultados
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  O ConcursaPlus nasceu em 2009, quando o Professor Ricardo Mendes, após ser aprovado 
                  em diversos concursos federais, decidiu compartilhar sua metodologia de estudos com 
                  outros candidatos.
                </p>
                <p>
                  O que começou como um pequeno curso presencial em São Paulo, rapidamente se 
                  transformou em uma das maiores plataformas de preparação para concursos do Brasil. 
                  A chave do nosso sucesso sempre foi a mesma: foco total na aprovação do aluno.
                </p>
                <p>
                  Hoje, contamos com uma equipe de mais de 30 professores especializados, todos com 
                  experiência comprovada em aprovações. Nossa plataforma online permite que alunos 
                  de todo o país tenham acesso à mesma qualidade de ensino que nos tornou referência 
                  no mercado.
                </p>
                <p>
                  Acreditamos que todo brasileiro merece a oportunidade de conquistar uma carreira 
                  estável e bem remunerada no serviço público. E trabalhamos todos os dias para 
                  tornar esse sonho uma realidade.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=800&fit=crop"
                  alt="Sala de aula"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-lg border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">15 Anos</div>
                    <div className="text-sm text-muted-foreground">de excelência</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Nossos Valores
            </Badge>
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