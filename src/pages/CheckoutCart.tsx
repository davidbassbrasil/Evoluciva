import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Check, Shield, Clock, BookOpen, CreditCard, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCart, getCourses, getCurrentUser, purchaseCourse, addUser, getUserByEmail, setCurrentUser, clearCart } from '@/lib/localStorage';
import { Course, User } from '@/types';

export default function CheckoutCart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', cardNumber: '', expiry: '', cvv: '' });

  useEffect(() => {
    const cart = getCart();
    const courses = getCourses();
    const selected = cart.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
    setItems(selected);

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData((prev) => ({ ...prev, name: currentUser.name, email: currentUser.email }));
    }
  }, []);

  const total = items.reduce((acc, c) => acc + c.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1500));

    let currentUser = user;
    if (!currentUser) {
      const existing = getUserByEmail(formData.email);
      if (existing) currentUser = existing;
      else {
        currentUser = {
          id: Math.random().toString(36).substr(2,9),
          name: formData.name,
          email: formData.email,
          password: '123456',
          avatar: '',
          purchasedCourses: [],
          progress: {},
          createdAt: new Date().toISOString(),
        };
        addUser(currentUser);
      }
      setCurrentUser(currentUser);
    }

    // Purchase each course
    items.forEach((course) => {
      if (currentUser) purchaseCourse(currentUser.id, course.id);
    });

    clearCart();

    toast({ title: 'Compra realizada com sucesso!', description: 'Você já pode acessar seus cursos na área do aluno.' });
    setLoading(false);
    navigate('/aluno/dashboard');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center py-24">
            <h2 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-6">Adicione cursos ao carrinho para finalizar a compra.</p>
            <Link to="/cursos"><Button className="gradient-bg text-primary-foreground">Ver Cursos</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b border-border py-4 px-6">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="order-2 lg:order-1">
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg sticky top-8">
              <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>
              <div className="space-y-4 mb-6">
                {items.map(i => (
                  <div key={i.id} className="flex items-center gap-4">
                    <img src={i.image} alt={i.title} className="w-24 h-16 object-cover rounded-lg" />
                    <div>
                      <h3 className="font-semibold line-clamp-2">{i.title}</h3>
                      <p className="text-sm text-muted-foreground">{i.instructor}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-muted-foreground text-sm line-through">R$ {Number(i.originalPrice || 0).toFixed(2)}</div>
                      <div className="text-lg font-bold">R$ {Number(i.price || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground mb-2"><span>Subtotal</span><span className="line-through">R$ {items.reduce((a,b)=>a+b.originalPrice,0).toFixed(2)}</span></div>
                <div className="flex justify-between text-success mb-2"><span>Desconto</span><span>-R$ {(items.reduce((a,b)=>a+b.originalPrice,0)-total).toFixed(2)}</span></div>
                <div className="flex justify-between text-xl font-bold"><span>Total</span><span className="gradient-text">R$ {total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Finalizar Compra</h2>
              <p className="text-muted-foreground mb-6">Preencha os dados para completar seu pedido</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" type="text" className="h-12 rounded-xl" placeholder="Seu nome" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" className="h-12 rounded-xl" placeholder="seu@email.com" value={formData.email} onChange={(e)=>setFormData({...formData,email:e.target.value})} required />
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-muted-foreground" /><span className="font-semibold">Dados do Cartão</span></div>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="cardNumber">Número do cartão</Label><Input id="cardNumber" type="text" className="h-12 rounded-xl" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={(e)=>setFormData({...formData,cardNumber:e.target.value})} required /></div>
                    <div className="grid grid-cols-2 gap-4"><Input placeholder="MM/AA" value={formData.expiry} onChange={(e)=>setFormData({...formData,expiry:e.target.value})} /><Input placeholder="CVV" value={formData.cvv} onChange={(e)=>setFormData({...formData,cvv:e.target.value})} /></div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full gradient-bg text-primary-foreground">{loading ? 'Processando...' : 'Pagar e Finalizar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
