import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { getSettings } from '@/lib/localStorage';
import { SiteSettings } from '@/types';
import logoPng from '@/assets/logo_.png';

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo & About */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logoPng} alt="Logo" className="h-10" />
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Venha com a gente!
            </p>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              <a
                href="https://www.instagram.com/edu_sampaio_cursos/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/edusampaio.portugues"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/user/eduardoredacao"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Úteis */}
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
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="font-bold text-lg mb-4">Políticas</h4>
            <ul className="space-y-2">
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

          {/* Contato - informações fictícias temporárias */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-0.5 text-primary-foreground/80" />
                <a href="mailto:contato@edusampaio.com" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  contato@edusampaio.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 text-primary-foreground/80" />
                <a href="tel:+551140000000" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  (82) 3031-6699
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-primary-foreground/80" />
                <span className="text-primary-foreground/70">
                  Av. Dom Antônio Brandão, 49 - Farol, Maceió - AL
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-primary-foreground/50 text-sm">
          <div>{settings.footerText}</div>
          <div className="mt-2 text-primary-foreground/60">CNPJ: 22.928.090/0001-18</div>
        </div>
      </div>
    </footer>
  );
}
