import { useEffect } from 'react';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { HeroBanner } from '@/components/landing/HeroBanner';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { TagsSection } from '@/components/landing/TagsSection';
import { ProfessorsSection } from '@/components/landing/ProfessorsSection';
import Popup from '@/components/landing/Popup';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import { FloatingButtons } from '@/components/landing/FloatingButtons';
import { SEOHead } from '@/components/SEOHead';
import { getOrganizationSchema, injectSchema } from '@/lib/schemas';

const Index = () => {
  useEffect(() => {
    // Injetar schema de organização
    const schema = getOrganizationSchema();
    injectSchema(schema);
  }, []);

  return (
    <>
      <SEOHead
        title="Edu Sampaio Cursos | Preparatório para Concursos Públicos em Maceió e Online"
        description="Mais de 20 anos ajudando candidatos a conquistar a aprovação em concursos públicos. Cursos presenciais em Maceió/AL e online para todo Brasil. Prof. Eduardo Sampaio e equipe especializada em Educação, Saúde e Legislação para concursos públicos. Comece sua jornada rumo à aprovação agora!"
        keywords="cursos preparatórios para concursos, preparação para concursos públicos, cursos para concursos Maceió, Edu Sampaio, Eduardo Sampaio, curso preparatório Alagoas, concursos públicos"
        type="website"
      />
      <div className="min-h-screen bg-background">
        <FloatingNav />
        <HeroBanner />
        <Popup />
        <CoursesSection />
        <TagsSection />
        <ProfessorsSection />
        <TestimonialsSection />
        <FAQSection />
        <Footer />
        <FloatingButtons />
      </div>
    </>
  );
};

export default Index;
