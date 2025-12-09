import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { getSettings, getCourses, getTags } from '@/lib/localStorage';
import { SiteSettings, Course, Tag } from '@/types';

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    setSettings(getSettings());
    setCourses(getCourses().slice(0, 4));
    setTags(getTags().slice(0, 6));
  }, []);

  if (!settings) return null;

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo & About */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="h-10" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">{settings.siteName}</span>
                </>
              )}
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              A melhor plataforma de cursos para concursos públicos do Brasil. 
              Prepare-se com os melhores professores e conquiste sua aprovação.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {settings.socialLinks.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.youtube && (
                <a
                  href={settings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.whatsapp && (
                <a
                  href={settings.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Cursos Populares */}
          <div>
            <h4 className="font-bold text-lg mb-4">Cursos Populares</h4>
            <ul className="space-y-2">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link to={`/curso/${course.id}`} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                    {course.title}
                  </Link>
                </li>
              ))}
              {courses.length > 0 && (
                <li>
                  <Link to="/cursos" className="text-primary hover:underline text-sm font-medium">
                    Ver todos os cursos →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Categorias (Tags) */}
          <div>
            <h4 className="font-bold text-lg mb-4">Categorias</h4>
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <Link to="/cursos" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links & Políticas */}
          <div>
            <h4 className="font-bold text-lg mb-4">Links Úteis</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/cursos" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Cursos
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/aluno/login" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Área do Aluno
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidade" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/lgpd" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  LGPD
                </Link>
              </li>
              <li>
                <Link to="/politica-de-reembolso" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Política de Reembolso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-primary-foreground/50 text-sm">
          {settings.footerText}
        </div>
      </div>
    </footer>
  );
}
