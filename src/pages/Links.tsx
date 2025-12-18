import { Link as RouterLink } from 'react-router-dom';
import logoSvg from '@/assets/logo_.svg';
import eduLinksImg from '@/assets/edulinks.jpg';
import { GraduationCap, Globe, Phone, Instagram, Facebook, Youtube, MapPin, ExternalLink } from 'lucide-react';

export default function Links() {
  const socialLinks = [
    {
      name: 'Site',
      description: 'Conheça nossos cursos',
      icon: Globe,
      url: '/',
      internal: true,
      color: 'from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
      bgColor: 'bg-slate-100 dark:bg-slate-800'
    },
    {
      name: 'WhatsApp',
      description: 'Atendimento',
      icon: Phone,
      url: 'https://api.whatsapp.com/send?phone=5582988163133',
      color: 'from-emerald-600 to-emerald-700',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      name: 'Instagram',
      description: 'Conteúdos e atualizações',
      icon: Instagram,
      url: 'https://www.instagram.com/edu_sampaio_cursos/',
      color: 'from-rose-600 to-rose-700',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20'
    },
    {
      name: 'Facebook',
      description: 'Comunidade e eventos',
      icon: Facebook,
      url: 'https://www.facebook.com/edusampaio.portugues',
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'YouTube',
      description: 'Aulas e materiais',
      icon: Youtube,
      url: 'https://www.youtube.com/user/eduardoredacao',
      color: 'from-red-600 to-red-700',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center py-4 sm:py-8 px-3 sm:px-4">
      {/* Efeito de fundo sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 dark:opacity-10"></div>
      
      <div className="w-full max-w-4xl relative z-10 px-3">
        {/* Layout Mobile - Single Column */}
        <div className="block lg:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            {/* Header Mobile */}
            <div className="flex flex-col items-center mt-4 mb-8">
              <div className="relative mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-full opacity-10 dark:opacity-20"></div>
                <img 
                  src={eduLinksImg} 
                  alt="Edu Sampaio" 
                  className="relative w-40 h-40 object-cover rounded-full border-4 border-white dark:border-slate-800 shadow-lg"
                />
              </div>

              {/* Logo e nome */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Edu Sampaio</h1>
                                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Especialista em preparatórios para concursos públicos.
                </p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-16 h-0.5 bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent mb-4"></div>

              {/* Descrição */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>Presencial em Maceió<br/>Online para todo Brasil</span>
                </div>
              </div>
            </div>

            {/* Links Mobile */}
            <div className="mb-2">
              <div className="flex items-center gap-0 mb-0">
              </div>
              
              <div className="space-y-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  const ButtonComponent = link.internal ? (
                    <RouterLink to={link.url} className="block">
                      <div className={`group relative p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-300 ${link.bgColor} cursor-pointer`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0 transition-transform duration-300 shadow-sm`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors truncate">
                                {link.name}
                              </h4>
                              <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex-shrink-0 ml-2" />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">{link.description}</p>
                          </div>
                        </div>
                      </div>
                    </RouterLink>
                  ) : (
                    <a href={link.url} target="_blank" rel="noreferrer" className="block">
                      <div className={`group relative p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-300 ${link.bgColor} cursor-pointer`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0 transition-transform duration-300 shadow-sm`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors truncate">
                                {link.name}
                              </h4>
                              <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex-shrink-0 ml-2" />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">{link.description}</p>
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                  
                  return <div key={link.name}>{ButtonComponent}</div>;
                })}
              </div>
            </div>

            {/* Localização Mobile */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Nossa Sede</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Visite nossa unidade em Maceió</p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
                <iframe
                  title="Localização - Edu Sampaio Cursos"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3933.0236904766844!2d-35.73396432503877!3d-9.659914890365953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7015509b8b8b8b8b%3A0x1234567890abcdef!2sAv.%20Dom%20Ant%C3%B4nio%20Brand%C3%A3o%2C%2049%20-%20Farol%2C%20Macei%C3%B3%20-%20AL%2C%2057051-190!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="space-y-1 text-sm text-center mb-6">
                <p className="text-slate-700 dark:text-slate-300 font-medium">Av. Dom Antônio Brandão, 49 - Farol</p>
                <p className="text-slate-500 dark:text-slate-400">Maceió - AL, 57051-190</p>
              </div>

              {/* Informações de contato */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Atendimento Presencial</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Seg-Sex: 15h às 21h</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Telefone</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">(82) 98816-3133</p>
                </div>
              </div>
            </div>

            {/* Footer Mobile */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  © 2025 Edu Sampaio Cursos.<br/>Todos os direitos reservados.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Desktop - Two Columns */}
        <div className="hidden lg:flex flex-col lg:flex-row gap-8">
          {/* Sidebar com informações principais */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 h-full">
              {/* Avatar e informações pessoais */}
              <div className="flex flex-col items-start text-left mb-8">
                <div className="relative mb-6">
                  <div className="absolute -inset-1 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-full opacity-10 dark:opacity-20"></div>
                  <img 
                    src={eduLinksImg} 
                    alt="Edu Sampaio" 
                    className="relative w-40 h-40 object-cover rounded-full border-4 border-white dark:border-slate-800 shadow-lg"
                  />
                </div>

                {/* Logo e nome */}
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Edu Sampaio</h1>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    Especialista em preparatórios para concursos públicos
                  </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-16 h-0.5 bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent mb-6"></div>

                {/* Descrição */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <p>Presencial em Maceió<br/>Online para todo Brasil</p>
                  </div>
                </div>
              </div>

              {/* Localização compacta */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <h4 className="font-semibold text-slate-700 dark:text-white">Localização</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">Av. Dom Antônio Brandão,<br/>49 - Farol</p>
                  <p className="text-slate-500 dark:text-slate-400">Maceió - AL, 57051-190</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo principal - Links */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 h-full">
              {/* Header da seção de links */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-0.5 bg-slate-900 dark:bg-white"></div>
                  <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conecte-se Conosco</h2>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Canais de Atendimento</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Escolha a melhor forma de se conectar e descobrir nossos cursos preparatórios
                </p>
              </div>

              {/* Links sociais */}
              <div className="space-y-4 mb-8">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  const ButtonComponent = link.internal ? (
                    <RouterLink to={link.url} className="block">
                      <div className={`group relative p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300 ${link.bgColor} cursor-pointer`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0 transition-transform duration-300 shadow-sm`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                                {link.name}
                              </h4>
                              <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex-shrink-0" />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{link.description}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-colors duration-300 pointer-events-none"></div>
                      </div>
                    </RouterLink>
                  ) : (
                    <a href={link.url} target="_blank" rel="noreferrer" className="block">
                      <div className={`group relative p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300 ${link.bgColor} cursor-pointer`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0 transition-transform duration-300 shadow-sm`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                                {link.name}
                              </h4>
                              <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex-shrink-0" />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{link.description}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-colors duration-300 pointer-events-none"></div>
                      </div>
                    </a>
                  );
                  
                  return <div key={link.name}>{ButtonComponent}</div>;
                })}
              </div>

              {/* Mapa */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Nossa Sede</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Visite nossa unidade em Maceió</p>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                  <iframe
                    title="Localização - Edu Sampaio Cursos"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3933.0236904766844!2d-35.73396432503877!3d-9.659914890365953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7015509b8b8b8b8b%3A0x1234567890abcdef!2sAv.%20Dom%20Ant%C3%B4nio%20Brand%C3%A3o%2C%2049%20-%20Farol%2C%20Macei%C3%B3%20-%20AL%2C%2057051-190!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="sm:h-[320px]"
                  />
                </div>

                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-left">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Atendimento Presencial</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Seg-Sex: 15h às 21h</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="text-left">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Telefone</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">(82) 98816-3133</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      © 2025 Edu Sampaio Cursos. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-2">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}