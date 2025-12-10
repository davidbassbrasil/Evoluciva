import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Globe, Phone, Instagram, Facebook, Youtube, MapPin } from 'lucide-react';

export default function Links() {
  const socialLinks = [
    {
      name: 'Site',
      description: 'Conheça nossos cursos',
      icon: Globe,
      url: '/',
      internal: true,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'WhatsApp',
      description: 'Fale conosco agora',
      icon: Phone,
      url: 'https://api.whatsapp.com/send?phone=5582988163133',
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Instagram',
      description: '@edu_sampaio_cursos',
      icon: Instagram,
      url: 'https://www.instagram.com/edu_sampaio_cursos/',
      color: 'from-pink-500 to-purple-600',
    },
    {
      name: 'Facebook',
      description: 'Siga nossa página',
      icon: Facebook,
      url: 'https://www.facebook.com/edusampaio.portugues',
      color: 'from-blue-600 to-blue-700',
    },
    {
      name: 'YouTube',
      description: 'Vídeos e aulas',
      icon: Youtube,
      url: 'https://www.youtube.com/user/eduardoredacao',
      color: 'from-red-500 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-secondary/20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8 bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl rounded-3xl">
          <div className="flex flex-col items-center mb-8">
            <img src={"/src/assets/logo_.svg"} alt="Logo" className="w-32 h-32 mb-2" />
            <img src={"/src/assets/edulinks.jpg"} alt="EduLinks" className="w-40 h-40 object-cover rounded-2xl shadow-lg mb-4" />

            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
              Edu Sampaio
            </h1>
            <p className="text-center text-muted-foreground max-w-md text-base">
              • Presencial em Maceió e online para todo o Brasil.
              <br/>• Preparatórios para concursos públicos.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              const ButtonComponent = link.internal ? (
                <RouterLink to={link.url} className="block w-full">
                  <Button 
                    className="w-full h-auto py-4 px-6 rounded-2xl flex items-center gap-4 transition-all hover:scale-105 hover:shadow-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base">{link.name}</div>
                      <div className="text-sm opacity-80">{link.description}</div>
                    </div>
                  </Button>
                </RouterLink>
              ) : (
                <a href={link.url} target="_blank" rel="noreferrer" className="block w-full">
                  <Button 
                    variant="outline"
                    className="w-full h-auto py-4 px-6 rounded-2xl flex items-center gap-4 transition-all hover:scale-105 hover:shadow-lg hover:border-primary/50 group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base text-foreground">{link.name}</div>
                      <div className="text-sm text-muted-foreground">{link.description}</div>
                    </div>
                  </Button>
                </a>
              );
              
              return <div key={link.name}>{ButtonComponent}</div>;
            })}
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4 text-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Nossa Localização</h3>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-border shadow-lg mb-4">
              <iframe
                title="Localização - Edu Sampaio Cursos"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3933.0236904766844!2d-35.73396432503877!3d-9.659914890365953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7015509b8b8b8b8b%3A0x1234567890abcdef!2sAv.%20Dom%20Ant%C3%B4nio%20Brand%C3%A3o%2C%2049%20-%20Farol%2C%20Macei%C3%B3%20-%20AL%2C%2057051-190!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr"
                width="100%"
                height="280"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Av. Dom Antônio Brandão, 49 – Farol
              </p>
              <p className="text-sm text-muted-foreground">
                Maceió – AL, 57051-190
              </p>
              <div className="pt-4 text-xs text-muted-foreground/70">
                © 2025 Edu Sampaio Cursos · Todos os direitos reservados
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
