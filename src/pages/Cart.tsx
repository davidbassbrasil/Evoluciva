import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCart, getCourses, removeFromCart } from '@/lib/localStorage';
import { Course } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';

export default function Cart() {
  const [items, setItems] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cart = getCart();
    const courses = getCourses();
    const selected = cart.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
    setItems(selected);
  }, []);

  const handleRemove = (id: string) => {
    removeFromCart(id);
    setItems((s) => s.filter(i => i.id !== id));
  };

  const total = items.reduce((acc, c) => acc + c.price, 0);

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
              {items.map((course) => (
                <div key={course.id} className="bg-card p-4 rounded-2xl flex items-center justify-between border border-border/50">
                  <div className="flex items-center gap-4">
                    <img src={course.image} alt={course.title} className="w-24 h-16 object-cover rounded-lg" />
                    <div>
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.instructor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-muted-foreground text-sm line-through">R$ {course.originalPrice.toFixed(2)}</div>
                      <div className="text-lg font-bold text-primary">R$ {course.price.toFixed(2)}</div>
                    </div>
                    <button onClick={() => handleRemove(course.id)} className="p-2 rounded-lg hover:bg-secondary">
                      <Trash2 className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
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
