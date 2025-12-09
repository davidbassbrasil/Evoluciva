import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Check, Shield, Clock, BookOpen, CreditCard, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCourses, getCurrentUser, purchaseCourse, setCurrentUser, addUser, getUserByEmail } from '@/lib/localStorage';
import { Course, User } from '@/types';

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    if (!courseId) {
      navigate('/');
      return;
    }

    const courses = getCourses();
    const foundCourse = courses.find((c) => c.id === courseId);
    if (!foundCourse) {
      navigate('/');
      return;
    }
    setCourse(foundCourse);

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email,
      }));
    }
  }, [courseId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setLoading(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let currentUser = user;

    // Create user if not logged in
    if (!currentUser) {
      const existingUser = getUserByEmail(formData.email);
      if (existingUser) {
        currentUser = existingUser;
      } else {
        currentUser = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          email: formData.email,
          password: '123456', // Default password
          avatar: '',
          purchasedCourses: [],
          progress: {},
          createdAt: new Date().toISOString(),
        };
        addUser(currentUser);
      }
      setCurrentUser(currentUser);
    }

    // Add course to user
    purchaseCourse(currentUser.id, course.id);

    toast({
      title: 'Compra realizada com sucesso!',
      description: 'Você já pode acessar seu curso.',
    });

    setLoading(false);
    navigate('/aluno/dashboard');
  };

  if (!course) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-card border-b border-border py-4 px-6">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">ConcursaPlus</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg sticky top-8">
              <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

              <div className="flex gap-4 mb-6">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-24 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.instructor}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration} de conteúdo</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessons} aulas</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Garantia de 7 dias</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground mb-2">
                  <span>Subtotal</span>
                  <span className="line-through">R$ {course.originalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-success mb-2">
                  <span>Desconto</span>
                  <span>-R$ {(course.originalPrice - course.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="gradient-text">R$ {course.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Finalizar Compra</h2>
              <p className="text-muted-foreground mb-6">
                Preencha os dados para completar seu pedido
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    className="h-12 rounded-xl"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-12 rounded-xl"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">Dados do Cartão</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Número do cartão</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        className="h-12 rounded-xl"
                        placeholder="0000 0000 0000 0000"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Validade</Label>
                        <Input
                          id="expiry"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="MM/AA"
                          value={formData.expiry}
                          onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold text-lg rounded-xl"
                >
                  {loading ? (
                    'Processando...'
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Finalizar Compra - R$ {course.price.toFixed(2)}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Pagamento 100% seguro</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
