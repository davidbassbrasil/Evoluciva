export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  instructor: string;
  duration: string;
  lessons: number;
  category: string;
  featured: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  videoUrl: string;
  order: number;
}

export interface Professor {
  id: string;
  name: string;
  specialty: string;
  image: string;
  bio: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Testimonial {
  id: string;
  name: string;
  course: string;
  text: string;
  rating: number;
  avatar: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  purchasedCourses: string[];
  progress: Record<string, { lessonId: string; completed: boolean }[]>;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  logo: string;
  primaryColor: string;
  footerText: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    youtube: string;
    whatsapp: string;
  };
}
