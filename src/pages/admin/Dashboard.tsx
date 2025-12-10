import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { getCourses, getUsers, getTestimonials, getBanners, getProfessors, getTags, getFAQs, getLessons } from '@/lib/localStorage';
import { Course, Testimonial, User } from '@/types';
import { BookOpen, Users, MessageSquare, Image, TrendingUp, GraduationCap, Tag, HelpCircle, PlayCircle, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import supabase from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    users: 0,
    testimonials: 0,
    banners: 0,
    professors: 0,
    tags: 0,
    faqs: 0,
    lessons: 0,
    totalRevenue: 0,
  });
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [recentTestimonials, setRecentTestimonials] = useState<Testimonial[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  // Pagination state
  const [recentCoursesAll, setRecentCoursesAll] = useState<Course[]>([]);
  const [coursePage, setCoursePage] = useState(0);
  const COURSES_PER_PAGE = 5;

  const [recentTestimonialsAll, setRecentTestimonialsAll] = useState<Testimonial[]>([]);
  const [testimonialsPage, setTestimonialsPage] = useState(0);
  const TESTIMONIALS_PER_PAGE = 3;

  const [recentUsersAll, setRecentUsersAll] = useState<User[]>([]);
  const [userPage, setUserPage] = useState(0);
  const USERS_PER_PAGE = 2;
  const [coursePrices, setCoursePrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      // Load courses from Supabase first, fallback to localStorage
      let courses: Course[] = [];
      if (supabase) {
        try {
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

          if (!coursesError && Array.isArray(coursesData)) {
            courses = coursesData as Course[];
          } else {
            courses = getCourses();
          }
        } catch (e) {
          courses = getCourses();
        }
      } else {
        courses = getCourses();
      }
      let users: User[] = [];
      
      // Try to fetch users from Supabase first
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, purchased_courses')
            .neq('role', 'admin');
          
          if (!error && data) {
            users = data.map((p: any) => ({
              id: p.id,
              name: p.full_name || '',
              email: p.email || '',
              password: '',
              avatar: '',
              purchasedCourses: Array.isArray(p.purchased_courses) ? p.purchased_courses : [],
              progress: {},
              createdAt: new Date().toISOString(),
            }));
          } else {
            // Fallback to localStorage
            users = getUsers().filter(u => u.email !== 'admin@admin.com');
          }
        } catch (e) {
          // Fallback to localStorage
          users = getUsers().filter(u => u.email !== 'admin@admin.com');
        }
      } else {
        // No Supabase, use localStorage
        users = getUsers().filter(u => u.email !== 'admin@admin.com');
      }
      
      const testimonials = getTestimonials();
      const lessons = getLessons();

      // Load turmas (to get prices per course)
      let turmas: any[] = [];
      if (supabase) {
        try {
          const { data: turmasData, error: turmasError } = await supabase
            .from('turmas')
            .select('id, course_id, price, price_online, status');
          if (!turmasError && Array.isArray(turmasData)) {
            turmas = turmasData;
          }
        } catch (e) {
          // ignore, fallback to no turmas
          turmas = [];
        }
      }

      // Build a map course_id -> min active turma price
      const priceMap: Record<string, number> = {};
      turmas.forEach((t) => {
        if (!t || t.status !== 'active') return;
        const cid = t.course_id;
        const p = Number(t.price) || 0;
        if (!priceMap[cid] || priceMap[cid] === 0) priceMap[cid] = p;
        else if (p > 0) priceMap[cid] = Math.min(priceMap[cid], p);
      });
      setCoursePrices(priceMap);
      
      // If Supabase is available, fetch enrollments for the loaded users to count courses per user
      const userCourseSets: Record<string, Set<string>> = {};
      if (supabase && users.length > 0) {
        try {
          const ids = users.map(u => u.id);
          const { data: enrollmentsData, error: enrollErr } = await supabase
            .from('enrollments')
            .select('profile_id, turma:turmas (course_id)')
            .in('profile_id', ids);

          if (!enrollErr && Array.isArray(enrollmentsData)) {
            enrollmentsData.forEach((e: any) => {
              const pid = e.profile_id;
              const cid = e.turma && e.turma.course_id ? e.turma.course_id : null;
              if (!pid) return;
              if (!userCourseSets[pid]) userCourseSets[pid] = new Set<string>();
              if (cid) userCourseSets[pid].add(cid);
            });
          }
        } catch (e) {
          // ignore
        }
      }

      // Calculate total revenue from purchased courses using turma price when available
      let totalRevenue = 0;
      users.forEach(user => {
        // combine purchasedCourses (from profile) with enrollments-derived course ids
        const fromProfile = Array.isArray(user.purchasedCourses) ? user.purchasedCourses : [];
        const fromEnroll = userCourseSets[user.id] ? Array.from(userCourseSets[user.id]) : [];
        const merged = Array.from(new Set([...fromProfile, ...fromEnroll]));
        // update user.purchasedCourses for downstream UI
        user.purchasedCourses = merged;

        merged.forEach(courseId => {
          const course = courses.find(c => c.id === courseId);
          const priceFromTurma = priceMap[courseId];
          if (priceFromTurma && priceFromTurma > 0) {
            totalRevenue += priceFromTurma;
          } else if (course) {
            totalRevenue += Number(course.price || 0);
          }
        });
      });

      // Temporarily disable revenue reporting until prices/configuration is finalized
      const displayRevenue = 0;
      setStats({
        courses: courses.length,
        users: users.length,
        testimonials: testimonials.length,
        banners: getBanners().length,
        professors: getProfessors().length,
        tags: getTags().length,
        faqs: getFAQs().length,
        lessons: lessons.length,
        totalRevenue: displayRevenue,
      });

      // recent courses: prefer most recent by created_at (courses already ordered)
      // Limit displayed items per page
      // store full lists and reset pages
      setRecentCoursesAll(courses);
      setCoursePage(0);
      setRecentTestimonialsAll(testimonials);
      setTestimonialsPage(0);
      setRecentUsersAll(users.slice(-20).reverse()); // keep recent users (up to 20) in memory
      setUserPage(0);

      // initial visible slices
      setRecentCourses(courses.slice(0, COURSES_PER_PAGE));
      setRecentTestimonials(testimonials.slice(0, TESTIMONIALS_PER_PAGE));
      setRecentUsers(users.slice(-USERS_PER_PAGE).reverse());
    };
    
    loadData();
  }, []);

  const mainCards = [
    { icon: BookOpen, label: 'Cursos', value: stats.courses, color: 'bg-primary', link: '/admin/cursos' },
    { icon: Users, label: 'Alunos', value: stats.users, color: 'bg-emerald-500', link: '/admin/alunos' },
    { icon: PlayCircle, label: 'Aulas', value: stats.lessons, color: 'bg-violet-500', link: '/admin/cursos' },
    { icon: TrendingUp, label: 'Financeiro', value: `R$ ${stats.totalRevenue.toFixed(2)}`, color: 'bg-amber-500', link: '/admin/financeiro' },
  ];

  const secondaryCards = [
    { icon: Image, label: 'Banners', value: stats.banners, link: '/admin/banners' },
    { icon: GraduationCap, label: 'Professores', value: stats.professors, link: '/admin/professores' },
    { icon: Tag, label: 'Tags', value: stats.tags, link: '/admin/tags' },
    { icon: MessageSquare, label: 'Depoimentos', value: stats.testimonials, link: '/admin/depoimentos' },
    { icon: HelpCircle, label: 'FAQ', value: stats.faqs, link: '/admin/faq' },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da plataforma - Todos os dados refletem nas páginas públicas</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainCards.map((card) => (
          <Link key={card.label} to={card.link} className="block group">
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              {card.label === 'Financeiro' ? (
                <div className="min-h-[2rem]" />
              ) : (
                <p className="text-3xl font-bold">{card.value}</p>
              )}
              <p className="text-muted-foreground">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {secondaryCards.map((card) => (
          <Link key={card.label} to={card.link} className="block group">
            <div className="bg-card rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <card.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <p className="text-xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Cursos Recentes</h2>
            <Link to="/admin/cursos">
              <Button variant="ghost" size="sm">
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentCoursesAll.slice(coursePage * COURSES_PER_PAGE, (coursePage + 1) * COURSES_PER_PAGE).map((course) => {
              const displayPrice = (coursePrices && coursePrices[course.id]) ? coursePrices[course.id] : Number(course.price || 0);
              const category = (course.category || '').toString();
              const showCategory = category && category.trim().length > 0 && ['geral', 'general'].indexOf(category.trim().toLowerCase()) === -1;
              return (
                <div key={course.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <img src={course.image} alt={course.title} className="w-16 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.instructor}</p>
                  </div>
                  {showCategory && <Badge variant="secondary">{course.category}</Badge>}
                  <span className="font-bold text-primary">R$ {displayPrice}</span>
                </div>
              );
            })}
            {recentCoursesAll.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum curso cadastrado</p>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">Página {coursePage + 1} de {Math.max(1, Math.ceil(recentCoursesAll.length / COURSES_PER_PAGE))}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCoursePage(p => Math.max(0, p - 1))} disabled={coursePage === 0}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCoursePage(p => p + 1)} disabled={(coursePage + 1) * COURSES_PER_PAGE >= recentCoursesAll.length}>Próxima</Button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          {/* Recent Users */}
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Novos Alunos</h2>
              <Link to="/admin/alunos">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsersAll.slice(userPage * USERS_PER_PAGE, (userPage + 1) * USERS_PER_PAGE).map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="outline">{user.purchasedCourses.length} cursos</Badge>
                </div>
              ))}
              {recentUsersAll.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum aluno cadastrado</p>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Página {userPage + 1} de {Math.max(1, Math.ceil(recentUsersAll.length / USERS_PER_PAGE))}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setUserPage(p => Math.max(0, p - 1))} disabled={userPage === 0}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setUserPage(p => p + 1)} disabled={(userPage + 1) * USERS_PER_PAGE >= recentUsersAll.length}>Próxima</Button>
              </div>
            </div>
          </div>

          {/* Recent Testimonials */}
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Depoimentos</h2>
              <Link to="/admin/depoimentos">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentTestimonialsAll.slice(testimonialsPage * TESTIMONIALS_PER_PAGE, (testimonialsPage + 1) * TESTIMONIALS_PER_PAGE).map((t) => (
                <div key={t.id} className="flex items-start gap-3">
                  <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.text}</p>
                  </div>
                </div>
              ))}
              {recentTestimonialsAll.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum depoimento</p>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Página {testimonialsPage + 1} de {Math.max(1, Math.ceil(recentTestimonialsAll.length / TESTIMONIALS_PER_PAGE))}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTestimonialsPage(p => Math.max(0, p - 1))} disabled={testimonialsPage === 0}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setTestimonialsPage(p => p + 1)} disabled={(testimonialsPage + 1) * TESTIMONIALS_PER_PAGE >= recentTestimonialsAll.length}>Próxima</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
        <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/cursos">
            <Button className="gradient-bg text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-2" /> Novo Curso
            </Button>
          </Link>
          <Link to="/admin/banners">
            <Button variant="outline">
              <Image className="w-4 h-4 mr-2" /> Editar Banners
            </Button>
          </Link>
          <Link to="/admin/professores">
            <Button variant="outline">
              <GraduationCap className="w-4 h-4 mr-2" /> Novo Professor
            </Button>
          </Link>
          <Link to="/" target="_blank">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" /> Ver Site
            </Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
