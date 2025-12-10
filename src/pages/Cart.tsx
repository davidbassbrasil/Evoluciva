import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCart, removeFromCart, getCurrentUser } from '@/lib/localStorage';
import { Turma } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import supabase from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export default function Cart() {
  const [items, setItems] = useState<Array<{ item: Turma; itemId: string; modality: 'presential' | 'online' }>>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // SECURITY: Check if user is logged in
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({ 
        title: 'Autenticação necessária', 
        description: 'Você precisa estar logado para acessar o carrinho.',
        variant: 'destructive'
      });
      sessionStorage.setItem('checkout_return_path', '/cart');
      navigate('/aluno/login');
      return;
    }

    const loadCartItems = async () => {
      const cartItems = getCart();
      
      if (cartItems.length === 0) {
        setLoading(false);
        return;
      }

      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Parsear itemIds para extrair turmaIds e modality
        const turmaIds = cartItems
          .map(item => {
            const parts = item.split(':');
            return parts[1]; // turmaId
          })
          .filter(Boolean);

        if (turmaIds.length === 0) {
          setLoading(false);
          return;
        }

        // Buscar turmas com JOIN para dados do curso
        const { data, error } = await supabase
          .from('turmas')
          .select(`
            *,
            course:courses (
              id,
              title,
              description,
              image,
              instructor,
              category,
              slug,
              full_description,
              whats_included,
              duration,
              lessons
            )
          `)
          .in('id', turmaIds);

        if (!error && data) {
          // Manter ordem do carrinho e associar itemId + modality
          const orderedItems = cartItems
            .map(itemId => {
              const parts = itemId.split(':');
              const turmaId = parts[1];
              const modality = (parts[2] || 'presential') as 'presential' | 'online';
              const turma = data.find((t: any) => t.id === turmaId);
              return turma ? { item: turma, itemId, modality } : null;
            })
            .filter(Boolean) as Array<{ item: Turma; itemId: string; modality: 'presential' | 'online' }>;
          
          setItems(orderedItems);
        }
      } catch (err) {
        console.error('Error loading cart items:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, [navigate, toast]);

  const handleRemove = (itemId: string) => {
    removeFromCart(itemId);
    setItems((s) => s.filter(i => i.itemId !== itemId));
  };

  const total = items.reduce((acc, item) => {
    const price = item.modality === 'online' ? Number(item.item.price_online) : Number(item.item.price);
    return acc + price;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FloatingNav />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando carrinho...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <FloatingNav />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center py-24">
            <h2 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-6">Adicione cursos ao carrinho para finalizar a compra.</p>
            <Link to="/cursos">
              <Button className="gradient-bg text-primary-foreground">Ver Cursos</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Carrinho</h1>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {items.map(({ item: turma, itemId, modality }) => {
                const displayPrice = modality === 'online' ? Number(turma.price_online) : Number(turma.price);
                const displayOriginalPrice = modality === 'online' ? Number(turma.original_price_online) : Number(turma.original_price);
                
                return (
                  <div key={itemId} className="bg-card p-4 rounded-2xl flex items-center justify-between border border-border/50">
                    <div className="flex items-center gap-4">
                      <img src={turma.course?.image} alt={turma.course?.title} className="w-24 h-16 object-cover rounded-lg" />
                      <div>
                        <h3 className="font-semibold">{turma.course?.title}</h3>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{turma.name}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {modality === 'online' ? 'Online' : 'Presencial'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{turma.course?.instructor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {displayOriginalPrice > displayPrice && (
                          <div className="text-muted-foreground text-sm line-through">
                            R$ {displayOriginalPrice.toFixed(2)}
                          </div>
                        )}
                        <div className="text-lg font-bold text-primary">
                          R$ {displayPrice.toFixed(2)}
                        </div>
                      </div>
                      <button onClick={() => handleRemove(itemId)} className="p-2 rounded-lg hover:bg-secondary">
                        <Trash2 className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="bg-card p-6 rounded-2xl border border-border/50 h-max mt-4">
              <div className="mb-4">
                <div className="text-muted-foreground text-sm">Total</div>
                <div className="text-2xl font-bold">R$ {total.toFixed(2)}</div>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/checkout')} className="w-full gradient-bg text-primary-foreground">Finalizar Compra</Button>
                <Link to="/cursos">
                  <Button variant="ghost" className="w-full">Continuar comprando</Button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
