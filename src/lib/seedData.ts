import { Course, Lesson, Professor, Tag, Testimonial, FAQ, Banner, User } from '@/types';
import * as storage from './localStorage';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const seedInitialData = () => {
  // Check if data already exists
  if (storage.getCourses().length > 0) return;

  // Seed Banners
  const banners: Banner[] = [
    {
      id: generateId(),
      title: 'Prepare-se para sua aprovação',
      subtitle: 'Os melhores cursos para concursos públicos com os professores mais renomados do Brasil',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=600&fit=crop',
      ctaText: 'Começar Agora',
      ctaLink: '#cursos',
    },
    {
      id: generateId(),
      title: 'Método aprovado por milhares',
      subtitle: 'Mais de 50.000 alunos aprovados em concursos federais, estaduais e municipais',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&h=600&fit=crop',
      ctaText: 'Ver Cursos',
      ctaLink: '#cursos',
    },
    {
      id: generateId(),
      title: 'Estude onde e quando quiser',
      subtitle: 'Acesse nossos cursos pelo computador, tablet ou celular a qualquer momento',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=600&fit=crop',
      ctaText: 'Conhecer Plataforma',
      ctaLink: '#cursos',
    },
  ];
  storage.setBanners(banners);

  // Seed Courses
  const courses: Course[] = [
    {
      id: generateId(),
      title: 'Português Completo para Concursos',
      description: 'Domine a língua portuguesa com técnicas avançadas de interpretação e gramática',
      price: 297,
      originalPrice: 497,
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop',
      instructor: 'Prof. Maria Santos',
      duration: '60 horas',
      lessons: 45,
      category: 'Português',
      featured: true,
    },
    {
      id: generateId(),
      title: 'Raciocínio Lógico Descomplicado',
      description: 'Aprenda lógica de forma simples e direta, do básico ao avançado',
      price: 247,
      originalPrice: 397,
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
      instructor: 'Prof. Carlos Lima',
      duration: '40 horas',
      lessons: 35,
      category: 'Raciocínio Lógico',
      featured: true,
    },
    {
      id: generateId(),
      title: 'Direito Constitucional',
      description: 'Constituição Federal comentada e atualizada para concursos',
      price: 347,
      originalPrice: 547,
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop',
      instructor: 'Prof. Ana Oliveira',
      duration: '80 horas',
      lessons: 60,
      category: 'Direito',
      featured: true,
    },
    {
      id: generateId(),
      title: 'Direito Administrativo',
      description: 'Tudo sobre administração pública, atos administrativos e licitações',
      price: 327,
      originalPrice: 497,
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
      instructor: 'Prof. Roberto Alves',
      duration: '70 horas',
      lessons: 50,
      category: 'Direito',
      featured: false,
    },
    {
      id: generateId(),
      title: 'Informática para Concursos',
      description: 'Windows, Office, Internet e Segurança da Informação atualizados',
      price: 197,
      originalPrice: 297,
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
      instructor: 'Prof. Pedro Tech',
      duration: '30 horas',
      lessons: 25,
      category: 'Informática',
      featured: false,
    },
    {
      id: generateId(),
      title: 'Matemática e Estatística',
      description: 'Conceitos fundamentais e avançados para provas de alto nível',
      price: 277,
      originalPrice: 427,
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=250&fit=crop',
      instructor: 'Prof. Julia Números',
      duration: '50 horas',
      lessons: 40,
      category: 'Matemática',
      featured: true,
    },
  ];
  storage.setCourses(courses);

  // Seed Lessons for first course
  const lessons: Lesson[] = [
    { id: generateId(), courseId: courses[0].id, title: 'Introdução à Gramática', duration: '45:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1 },
    { id: generateId(), courseId: courses[0].id, title: 'Classes de Palavras', duration: '60:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 2 },
    { id: generateId(), courseId: courses[0].id, title: 'Sintaxe Básica', duration: '55:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 3 },
    { id: generateId(), courseId: courses[0].id, title: 'Concordância Verbal', duration: '50:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 4 },
    { id: generateId(), courseId: courses[0].id, title: 'Concordância Nominal', duration: '45:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 5 },
    { id: generateId(), courseId: courses[1].id, title: 'Proposições Lógicas', duration: '40:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1 },
    { id: generateId(), courseId: courses[1].id, title: 'Conectivos', duration: '35:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 2 },
    { id: generateId(), courseId: courses[1].id, title: 'Tabela Verdade', duration: '50:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 3 },
  ];
  storage.setLessons(lessons);

  // Seed Professors
  const professors: Professor[] = [
    {
      id: generateId(),
      name: 'Prof. Maria Santos',
      specialty: 'Português e Redação',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop',
      bio: 'Mestre em Linguística com 15 anos de experiência em preparação para concursos.',
    },
    {
      id: generateId(),
      name: 'Prof. Carlos Lima',
      specialty: 'Raciocínio Lógico',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop',
      bio: 'Doutor em Matemática pela USP, especialista em lógica para concursos.',
    },
    {
      id: generateId(),
      name: 'Prof. Ana Oliveira',
      specialty: 'Direito Constitucional',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop',
      bio: 'Procuradora Federal aposentada com vasta experiência em bancas.',
    },
    {
      id: generateId(),
      name: 'Prof. Roberto Alves',
      specialty: 'Direito Administrativo',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      bio: 'Ex-auditor do TCU, professor há mais de 20 anos.',
    },
  ];
  storage.setProfessors(professors);

  // Seed Tags
  const tags: Tag[] = [
    { id: generateId(), name: 'Português', color: '#3B82F6' },
    { id: generateId(), name: 'Matemática', color: '#10B981' },
    { id: generateId(), name: 'Raciocínio Lógico', color: '#8B5CF6' },
    { id: generateId(), name: 'Direito Constitucional', color: '#F59E0B' },
    { id: generateId(), name: 'Direito Administrativo', color: '#EF4444' },
    { id: generateId(), name: 'Informática', color: '#06B6D4' },
    { id: generateId(), name: 'Atualidades', color: '#EC4899' },
    { id: generateId(), name: 'Redação', color: '#14B8A6' },
  ];
  storage.setTags(tags);

  // Seed Testimonials
  const testimonials: Testimonial[] = [
    {
      id: generateId(),
      name: 'João Silva',
      course: 'Português Completo',
      text: 'Graças ao curso da Prof. Maria, consegui minha aprovação no TRT! A didática é incrível e o material muito completo.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    },
    {
      id: generateId(),
      name: 'Ana Paula',
      course: 'Raciocínio Lógico',
      text: 'Sempre tive dificuldade com lógica, mas o Prof. Carlos conseguiu descomplicar tudo. Aprovada na Polícia Federal!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      id: generateId(),
      name: 'Carlos Eduardo',
      course: 'Direito Constitucional',
      text: 'O melhor investimento que fiz na minha preparação. Conteúdo atualizado e professores de altíssimo nível.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      id: generateId(),
      name: 'Mariana Costa',
      course: 'Combo Concursos',
      text: 'Em 8 meses de estudo focado com a plataforma, passei em 2º lugar para Analista do INSS. Recomendo demais!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
  ];
  storage.setTestimonials(testimonials);

  // Seed FAQs
  const faqs: FAQ[] = [
    {
      id: generateId(),
      question: 'Por quanto tempo tenho acesso ao curso?',
      answer: 'Você terá acesso ao curso por 1 ano a partir da data da compra, podendo assistir quantas vezes quiser nesse período.',
    },
    {
      id: generateId(),
      question: 'Posso assistir as aulas pelo celular?',
      answer: 'Sim! Nossa plataforma é 100% responsiva e você pode assistir pelo computador, tablet ou celular.',
    },
    {
      id: generateId(),
      question: 'Como funciona a garantia?',
      answer: 'Oferecemos garantia de 7 dias. Se não gostar do curso, devolvemos 100% do seu dinheiro, sem perguntas.',
    },
    {
      id: generateId(),
      question: 'Os cursos possuem certificado?',
      answer: 'Sim, ao concluir o curso você recebe um certificado de conclusão que pode ser utilizado para horas complementares.',
    },
    {
      id: generateId(),
      question: 'Posso tirar dúvidas com os professores?',
      answer: 'Sim! Temos um sistema de dúvidas onde você pode perguntar diretamente aos professores e nossa equipe pedagógica.',
    },
  ];
  storage.setFAQs(faqs);

  // Create admin user
  const adminUser: User = {
    id: 'admin',
    name: 'Administrador',
    email: 'admin@admin.com',
    password: 'admin123',
    avatar: '',
    purchasedCourses: [],
    progress: {},
    createdAt: new Date().toISOString(),
  };
  storage.addUser(adminUser);
};
