import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getSettings, setSettings } from '@/lib/localStorage';
import { SiteSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Globe, Palette, Share2 } from 'lucide-react';

export default function AdminConfiguracoes() {
  const [settings, setSettingsState] = useState<SiteSettings>(getSettings());
  const { toast } = useToast();

  useEffect(() => {
    setSettingsState(getSettings());
  }, []);

  const handleSave = () => {
    setSettings(settings);
    toast({ title: 'Configurações salvas!', description: 'As alterações serão refletidas em todo o site.' });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações do Site</h1>
        <p className="text-muted-foreground">Personalize a aparência e informações do seu site</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Informações Gerais</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Nome do Site</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettingsState({ ...settings, siteName: e.target.value })}
                placeholder="Nome do site"
              />
            </div>

            <div>
              <Label htmlFor="logo">URL do Logo</Label>
              <Input
                id="logo"
                value={settings.logo}
                onChange={(e) => setSettingsState({ ...settings, logo: e.target.value })}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="footerText">Texto do Rodapé</Label>
              <Input
                id="footerText"
                value={settings.footerText}
                onChange={(e) => setSettingsState({ ...settings, footerText: e.target.value })}
                placeholder="© 2024 Seu Site"
              />
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Cores</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="primaryColor">Cor Principal</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="primaryColor"
                  value={settings.primaryColor}
                  onChange={(e) => setSettingsState({ ...settings, primaryColor: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => setSettingsState({ ...settings, primaryColor: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-2">Preview da cor:</p>
              <div 
                className="w-full h-12 rounded-lg shadow-inner flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Cor Principal
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-card rounded-2xl p-6 border border-border/50 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Redes Sociais</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.socialLinks.instagram}
                onChange={(e) => setSettingsState({ 
                  ...settings, 
                  socialLinks: { ...settings.socialLinks, instagram: e.target.value } 
                })}
                placeholder="https://instagram.com/seuusuario"
              />
            </div>

            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={settings.socialLinks.facebook}
                onChange={(e) => setSettingsState({ 
                  ...settings, 
                  socialLinks: { ...settings.socialLinks, facebook: e.target.value } 
                })}
                placeholder="https://facebook.com/suapagina"
              />
            </div>

            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={settings.socialLinks.youtube}
                onChange={(e) => setSettingsState({ 
                  ...settings, 
                  socialLinks: { ...settings.socialLinks, youtube: e.target.value } 
                })}
                placeholder="https://youtube.com/seucanal"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={settings.socialLinks.whatsapp}
                onChange={(e) => setSettingsState({ 
                  ...settings, 
                  socialLinks: { ...settings.socialLinks, whatsapp: e.target.value } 
                })}
                placeholder="https://wa.me/5511999999999"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} className="gradient-bg text-primary-foreground" size="lg">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </AdminLayout>
  );
}
