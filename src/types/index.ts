export interface Course {
  id: string;
  title: string;
  description: string;
  full_description?: string;
  whats_included?: string;
  price: number;
  originalPrice: number;
  image: string;
  link_video?: string;
  instructor: string;
  duration: string;
  lessons: number;
  category: string;
  estado?: string;
  featured: boolean;
  active?: boolean;
  display_order?: number;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Turma {
  id: string;
  name: string;
  course_id: string;
  start_date: string | null;
  sale_start_date: string | null;
  sale_end_date: string | null;
  access_end_date: string | null;
  presential_slots: number;
  online_slots: number;
  status: 'active' | 'coming_soon' | 'inactive';
  price: number;
  price_online: number;
  original_price: number;
  original_price_online: number;
  allow_credit_card: boolean;
  allow_installments: boolean;
  max_installments: number;
  allow_debit_card: boolean;
  allow_pix: boolean;
  allow_boleto: boolean;
  discount_cash: number;
  discount_pix: number;
  discount_debit: number;
  coupon_code: string | null;
  coupon_discount: number;
  weekdays?: string[];
  sessions?: { day: string; start: string; end?: string }[];
  created_at?: string;
  updated_at?: string;
  // Campos do JOIN com courses
  course?: Course;
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
  slug?: string;
  created_at?: string;
  updated_at?: string;
  // Novo: indica se o professor está ativo (visível na página pública)
  active?: boolean;
  // Novo: campo para controlar a ordem de exibição (0 = primeiro)
  order?: number;
  courses?: {
    id: string;
    title: string;
    slug: string;
    image?: string;
  }[];
} 

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description_tag?: string;
  course_id?: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  avatar: string;
  created_at?: string;
  updated_at?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Banner {
  id: string;
  image: string;
  order: number;
  created_at?: string;
  updated_at?: string;
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

export interface Module {
  id: string;
  name: string;
  turma_id: string;
  stock_quantity: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  // Campos extras do JOIN/View
  turma_name?: string;
  course_id?: string;
  course_title?: string;
  delivered_count?: number;
  available_count?: number;
  total_students?: number;
  turma?: Turma;
}

export interface ModuleDelivery {
  id: string;
  module_id: string;
  student_id: string;
  delivered_at: string;
  delivered_by: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Campos extras do JOIN
  module?: Module;
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
  delivered_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface ModuleWithDeliveries extends Module {
  deliveries?: ModuleDelivery[];
  students_with_delivery?: {
    student_id: string;
    student_name: string;
    student_email: string;
    delivered: boolean;
    delivered_at?: string;
    delivery_id?: string;
  }[];
}
