import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Loader2, ShoppingCart, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCart, removeFromCart, getCurrentUser } from '@/lib/localStorage';
import { Turma, Course } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import supabase from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export default function Cart() {
  const [items, setItems] = useState<Array<{ item: Turma; itemId: string; modality: 'presential' | 'online' }>>([]);
  const [upsellCourses, setUpsellCourses] = useState<Course[]>([]);
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

          // Carregar cursos de upsell
          const courseIdsInCart = orderedItems.map(item => item.item.course.id);
          
          if (courseIdsInCart.length > 0) {
            // Buscar cursos configurados como upsell para os cursos no carrinho
            const { data: upsellLinks } = await supabase
              .from('course_upsells')
              .select('upsell_course_id')
              .in('course_id', courseIdsInCart);

            if (upsellLinks && upsellLinks.length > 0) {
              const upsellCourseIds = [...new Set(upsellLinks.map(link => link.upsell_course_id))];
              
              // Filtrar cursos que já não estão no carrinho
              const filteredUpsellIds = upsellCourseIds.filter(id => !courseIdsInCart.includes(id));

              if (filteredUpsellIds.length > 0) {
                // Buscar turmas dos cursos de upsell para obter preços
                const { data: upsellTurmas } = await supabase
                  .from('turmas')
                  .select(`
                    id,
                    price,
                    original_price,
                    price_online,
                    original_price_online,
                    course:courses (*)
                  `)
                  .in('course_id', filteredUpsellIds);

                if (upsellTurmas && upsellTurmas.length > 0) {
                  // Pegar primeira turma de cada curso
                  const uniqueCourses = new Map();
                  upsellTurmas.forEach(turma => {
                    if (!uniqueCourses.has(turma.course.id)) {
                      uniqueCourses.set(turma.course.id, {
                        ...turma.course,
                        price: turma.price,
                        original_price: turma.original_price,
                        price_online: turma.price_online,
                        original_price_online: turma.original_price_online,
                        turma_id: turma.id
                      });
                    }
                  });
                  
                  const upsellCoursesWithPrice = Array.from(uniqueCourses.values()).slice(0, 3);
                  setUpsellCourses(upsellCoursesWithPrice);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading cart items:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, [navigate, toast]);

  const handleRemove = async (itemId: string) => {
    removeFromCart(itemId);
    const newItems = items.filter(i => i.itemId !== itemId);
    setItems(newItems);

    // Recarregar upsells após remover item
    if (supabase && newItems.length > 0) {
      const courseIdsInCart = newItems.map(item => item.item.course.id);
      
      const { data: upsellLinks } = await supabase
        .from('course_upsells')
        .select('upsell_course_id')
        .in('course_id', courseIdsInCart);

      if (upsellLinks && upsellLinks.length > 0) {
        const upsellCourseIds = [...new Set(upsellLinks.map(link => link.upsell_course_id))];
        const filteredUpsellIds = upsellCourseIds.filter(id => !courseIdsInCart.includes(id));

        if (filteredUpsellIds.length > 0) {
          const { data: upsellTurmas } = await supabase
            .from('turmas')
            .select(`
              id,
              price,
              original_price,
              price_online,
              original_price_online,
              course:courses (*)
            `)
            .in('course_id', filteredUpsellIds);

          if (upsellTurmas && upsellTurmas.length > 0) {
            const uniqueCourses = new Map();
            upsellTurmas.forEach(turma => {
              if (!uniqueCourses.has(turma.course.id)) {
                uniqueCourses.set(turma.course.id, {
                  ...turma.course,
                  price: turma.price,
                  original_price: turma.original_price,
                  price_online: turma.price_online,
                  original_price_online: turma.original_price_online,
                  turma_id: turma.id
                });
              }
            });
            
            const upsellCoursesWithPrice = Array.from(uniqueCourses.values()).slice(0, 3);
            setUpsellCourses(upsellCoursesWithPrice);
          }
        } else {
          setUpsellCourses([]);
        }
      }
    } else if (newItems.length === 0) {
      setUpsellCourses([]);
    }
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
                  <div key={itemId} className="bg-card p-4 rounded-2xl border border-border/50">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <img src={turma.course?.image} alt={turma.course?.title} className="w-20 h-28 object-cover rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 line-clamp-2">{turma.course?.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">{turma.name}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {modality === 'online' ? 'Online' : 'Presencial'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{turma.course?.instructor}</p>
                        {turma.course?.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words">{turma.course.description}</p>
                        )}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto shrink-0">
                        <div className="text-left sm:text-right flex-1 sm:flex-initial">
                          {displayOriginalPrice > displayPrice && (
                            <div className="text-muted-foreground text-sm line-through">
                              R$ {displayOriginalPrice.toFixed(2)}
                            </div>
                          )}
                          <div className="text-lg font-bold text-primary whitespace-nowrap">
                            R$ {displayPrice.toFixed(2)}
                          </div>
                        </div>
                        <button onClick={() => handleRemove(itemId)} className="p-2 rounded-lg hover:bg-secondary shrink-0">
                          <Trash2 className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Seção de Upsell */}
              {upsellCourses.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Outros Concursos</h2>
                  <div className="grid gap-4">
                    {upsellCourses.map((course) => (
                      <div key={course.id} className="bg-card p-4 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors">
                        <div className="flex gap-4">
                          <img src={course.image} alt={course.title} className="w-20 h-28 object-cover rounded-lg shrink-0" />
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div>
                              <h3 className="font-semibold mb-1 line-clamp-2">{course.title}</h3>
                              <p className="text-sm text-muted-foreground mb-1">{course.instructor}</p>
                              {course.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 break-words">{course.description}</p>
                              )}
                            </div>
                            <div className="flex items-end justify-between mt-auto pt-2">
                              <div className="text-left">
                                {course.original_price > course.price && (
                                  <div className="text-muted-foreground text-sm line-through">
                                    R$ {Number(course.original_price).toFixed(2)}
                                  </div>
                                )}
                                <div className="text-lg font-bold text-primary whitespace-nowrap">
                                  R$ {Number(course.price).toFixed(2)}
                                </div>
                              </div>
                              <Link to={`/curso/${course.slug}`}>
                                <Button 
                                  size="sm"
                                  className="gradient-bg text-primary-foreground whitespace-nowrap"
                                >
                                  Ver Curso
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="bg-card p-6 rounded-2xl border border-border/50 h-max mt-4">
              <div className="mb-4">
                <div className="text-muted-foreground text-sm">Total</div>
                <div className="text-2xl font-bold">R$ {total.toFixed(2)}</div>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/checkout')} className="w-full gradient-bg text-primary-foreground h-12 text-base">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Finalizar Compra
                </Button>
                <Link to="/cursos">
                  <Button variant="outline" className="w-full h-12 text-base">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Continuar comprando
                  </Button>
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
