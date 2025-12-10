import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';

export default function Links() {
  return (
    <div className="min-h-screen bg-secondary/10 flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <Card className="p-6 bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <RouterLink to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" /> Voltar
            </RouterLink>
            <span className="text-sm text-muted-foreground">Links</span>
          </div>

          {/* Logo placeholder */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-12 bg-gradient-to-r from-primary-400 to-primary-600 rounded-md flex items-center justify-center text-white font-bold">
              LOGO
            </div>

            {/* Round photo */}
            <Avatar className="w-24 h-24">
              <img src="https://placehold.co/96x96" alt="Avatar" />
            </Avatar>

            <div className="text-center">
              <h2 className="text-lg font-semibold">Edu Sampaio Cursos</h2>
              <p className="text-sm text-muted-foreground">Cursos preparatórios e aulas de português e redação</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            <a href="/" target="_blank" rel="noreferrer">
              <Button className="w-full">Site</Button>
            </a>
            <a href="https://api.whatsapp.com/send?phone=5582988163133" target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">WhatsApp</Button>
            </a>
            <a href="https://www.instagram.com/edu_sampaio_cursos/" target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">Instagram</Button>
            </a>
            <a href="https://www.facebook.com/edusampaio.portugues" target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">Facebook</Button>
            </a>
            <a href="https://www.youtube.com/user/eduardoredacao" target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">YouTube</Button>
            </a>
          </div>

          {/* Map & address */}
          <div className="mt-6 text-sm text-muted-foreground space-y-2">
            <a href="https://www.google.com/maps?ll=-9.659914,-35.733964&z=15&t=m&hl=pt-BR&gl=US&mapclient=embed&q=Av.+Dom+Ant%C3%B4nio+Brand%C3%A3o,+49+-+Farol+Macei%C3%B3+-+AL+57051-190" target="_blank" rel="noreferrer" className="block text-primary-600 hover:underline">Ver no Google Maps</a>
            <div>Av. Dom Antônio Brandão, 49 – Farol, Maceió – AL, 57051-190</div>
            <div className="mt-4 text-xs text-muted-foreground">© 2025  |  Todos os direitos reservados</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
