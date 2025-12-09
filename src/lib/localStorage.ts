import { Course, Lesson, Professor, Tag, Testimonial, FAQ, Banner, User, SiteSettings } from '@/types';

const STORAGE_KEYS = {
  COURSES: 'cursos_courses',
  LESSONS: 'cursos_lessons',
  PROFESSORS: 'cursos_professors',
  TAGS: 'cursos_tags',
  TESTIMONIALS: 'cursos_testimonials',
  FAQS: 'cursos_faqs',
  BANNERS: 'cursos_banners',
  USERS: 'cursos_users',
  CURRENT_USER: 'cursos_current_user',
  SETTINGS: 'cursos_settings',
};

// Generic helpers
function getItem<T>(key: string, defaultValue: T): T {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Courses
export const getCourses = (): Course[] => getItem(STORAGE_KEYS.COURSES, []);
export const setCourses = (courses: Course[]) => setItem(STORAGE_KEYS.COURSES, courses);
export const addCourse = (course: Course) => setCourses([...getCourses(), course]);
export const updateCourse = (course: Course) => setCourses(getCourses().map(c => c.id === course.id ? course : c));
export const deleteCourse = (id: string) => setCourses(getCourses().filter(c => c.id !== id));

// Lessons
export const getLessons = (): Lesson[] => getItem(STORAGE_KEYS.LESSONS, []);
export const setLessons = (lessons: Lesson[]) => setItem(STORAGE_KEYS.LESSONS, lessons);
export const getLessonsByCourse = (courseId: string) => getLessons().filter(l => l.courseId === courseId);
export const addLesson = (lesson: Lesson) => setLessons([...getLessons(), lesson]);
export const updateLesson = (lesson: Lesson) => setLessons(getLessons().map(l => l.id === lesson.id ? lesson : l));
export const deleteLesson = (id: string) => setLessons(getLessons().filter(l => l.id !== id));

// Professors
export const getProfessors = (): Professor[] => getItem(STORAGE_KEYS.PROFESSORS, []);
export const setProfessors = (professors: Professor[]) => setItem(STORAGE_KEYS.PROFESSORS, professors);
export const addProfessor = (professor: Professor) => setProfessors([...getProfessors(), professor]);
export const updateProfessor = (professor: Professor) => setProfessors(getProfessors().map(p => p.id === professor.id ? professor : p));
export const deleteProfessor = (id: string) => setProfessors(getProfessors().filter(p => p.id !== id));

// Tags
export const getTags = (): Tag[] => getItem(STORAGE_KEYS.TAGS, []);
export const setTags = (tags: Tag[]) => setItem(STORAGE_KEYS.TAGS, tags);
export const addTag = (tag: Tag) => setTags([...getTags(), tag]);
export const deleteTag = (id: string) => setTags(getTags().filter(t => t.id !== id));

// Testimonials
export const getTestimonials = (): Testimonial[] => getItem(STORAGE_KEYS.TESTIMONIALS, []);
export const setTestimonials = (testimonials: Testimonial[]) => setItem(STORAGE_KEYS.TESTIMONIALS, testimonials);
export const addTestimonial = (testimonial: Testimonial) => setTestimonials([...getTestimonials(), testimonial]);
export const updateTestimonial = (testimonial: Testimonial) => setTestimonials(getTestimonials().map(t => t.id === testimonial.id ? testimonial : t));
export const deleteTestimonial = (id: string) => setTestimonials(getTestimonials().filter(t => t.id !== id));

// FAQs
export const getFAQs = (): FAQ[] => getItem(STORAGE_KEYS.FAQS, []);
export const setFAQs = (faqs: FAQ[]) => setItem(STORAGE_KEYS.FAQS, faqs);
export const addFAQ = (faq: FAQ) => setFAQs([...getFAQs(), faq]);
export const updateFAQ = (faq: FAQ) => setFAQs(getFAQs().map(f => f.id === faq.id ? faq : f));
export const deleteFAQ = (id: string) => setFAQs(getFAQs().filter(f => f.id !== id));

// Banners
export const getBanners = (): Banner[] => getItem(STORAGE_KEYS.BANNERS, []);
export const setBanners = (banners: Banner[]) => setItem(STORAGE_KEYS.BANNERS, banners);
export const addBanner = (banner: Banner) => setBanners([...getBanners(), banner]);
export const updateBanner = (banner: Banner) => setBanners(getBanners().map(b => b.id === banner.id ? banner : b));
export const deleteBanner = (id: string) => setBanners(getBanners().filter(b => b.id !== id));

// Users
export const getUsers = (): User[] => getItem(STORAGE_KEYS.USERS, []);
export const setUsers = (users: User[]) => setItem(STORAGE_KEYS.USERS, users);
export const addUser = (user: User) => setUsers([...getUsers(), user]);
export const updateUser = (user: User) => {
  setUsers(getUsers().map(u => u.id === user.id ? user : u));
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === user.id) {
    setCurrentUser(user);
  }
};
export const getUserByEmail = (email: string) => getUsers().find(u => u.email === email);

// Current User (Auth)
export const getCurrentUser = (): User | null => getItem(STORAGE_KEYS.CURRENT_USER, null);
export const setCurrentUser = (user: User | null) => setItem(STORAGE_KEYS.CURRENT_USER, user);
export const logout = () => localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

// Site Settings
export const getSettings = (): SiteSettings => getItem(STORAGE_KEYS.SETTINGS, {
  siteName: 'ConcursaPlus',
  logo: '',
  primaryColor: '#3B82F6',
  footerText: '© 2024 ConcursaPlus. Todos os direitos reservados.',
  socialLinks: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    whatsapp: 'https://whatsapp.com',
  },
});
export const setSettings = (settings: SiteSettings) => setItem(STORAGE_KEYS.SETTINGS, settings);

// Purchase course
export const purchaseCourse = (userId: string, courseId: string) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user && !user.purchasedCourses.includes(courseId)) {
    user.purchasedCourses.push(courseId);
    user.progress[courseId] = [];
    updateUser(user);
  }
};

// Update progress
export const updateProgress = (userId: string, courseId: string, lessonId: string, completed: boolean) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    if (!user.progress[courseId]) {
      user.progress[courseId] = [];
    }
    const lessonProgress = user.progress[courseId].find(p => p.lessonId === lessonId);
    if (lessonProgress) {
      lessonProgress.completed = completed;
    } else {
      user.progress[courseId].push({ lessonId, completed });
    }
    updateUser(user);
  }
};
