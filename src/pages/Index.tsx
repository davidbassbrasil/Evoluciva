import { useEffect } from 'react';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { HeroBanner } from '@/components/landing/HeroBanner';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { TagsSection } from '@/components/landing/TagsSection';
import { ProfessorsSection } from '@/components/landing/ProfessorsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import { FloatingButtons } from '@/components/landing/FloatingButtons';

const Index = () => {
  useEffect(() => {
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      <HeroBanner />
      <CoursesSection />
      <TagsSection />
      <ProfessorsSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
