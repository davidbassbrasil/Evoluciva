/**
 * Checkout Page - Integrado com Asaas
 * Suporta: Cartão de Crédito, PIX e Boleto
 * @updated 2025-12-09
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Check, Shield, Clock, BookOpen, CreditCard, ChevronLeft, QrCode, Barcode, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, getCart, clearCart, purchaseCourse, setCurrentUser, addUser, getUserByEmail } from '@/lib/localStorage';
import { asaasService } from '@/lib/asaasService';
import type { Course, User } from '@/types';
import supabase from '@/lib/supabaseClient';

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [cartItems, setCartItems] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD_ONE' | 'CREDIT_CARD_INSTALL' | 'DEBIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD_ONE');
  const [installmentCount, setInstallmentCount] = useState<number>(2);
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [pixCopyPaste, setPixCopyPaste] = useState<string>('');
  const [boletoUrl, setBoletoUrl] = useState<string>('');
  const [boletoBarcode, setBoletoBarcode] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    postalCode: '',
    addressNumber: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    
    // SECURITY: Redirect to login if not authenticated
    if (!currentUser) {
      toast({ 
        title: 'Autenticação necessária', 
        description: 'Você precisa estar logado para finalizar a compra.',
        variant: 'destructive'
      });
      // Save current path to return after login
      sessionStorage.setItem('checkout_return_path', window.location.pathname);
      navigate('/aluno/login');
      return;
    }

    setUser(currentUser);
    setFormData((prev) => ({ ...prev, name: currentUser.name, email: currentUser.email }));

    const loadCourseData = async () => {
      if (!supabase) {
        if (courseId) navigate('/');
        return;
      }

      try {
        if (courseId) {
          // Single course checkout
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

          if (error || !data) {
            toast({ title: 'Erro', description: 'Curso não encontrado', variant: 'destructive' });
            navigate('/');
            return;
          }
          setCourse(data);
        } else {
          // Cart checkout
          const cartIds = getCart();
          if (cartIds.length === 0) {
            toast({ title: 'Carrinho vazio', description: 'Adicione cursos antes de finalizar a compra.' });
            navigate('/cursos');
            return;
          }

          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .in('id', cartIds);

          if (!error && data) {
            const orderedCourses = cartIds
              .map(id => data.find(course => course.id === id))
              .filter(Boolean) as Course[];
            setCartItems(orderedCourses);
          }
        }
      } catch (err) {
        console.error('Error loading course data:', err);
        toast({ title: 'Erro', description: 'Erro ao carregar dados do curso', variant: 'destructive' });
        navigate('/');
      }
    };

    loadCourseData();
  }, [courseId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Determine items to purchase and total
    const itemsToPurchase = course ? [course] : cartItems;
    if (!course && itemsToPurchase.length === 0) {
      toast({ title: 'Carrinho vazio', description: 'Adicione cursos antes de finalizar a compra.' });
      return;
    }

    // Validar se Asaas está configurado
    if (!asaasService.isConfigured()) {
      toast({
        title: 'Configuração Pendente',
        description: 'O sistema de pagamento ainda não está configurado. Entre em contato com o suporte.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let currentUser = user;

      // Criar usuário se não estiver logado
      if (!currentUser) {
        const existingUser = getUserByEmail(formData.email);
        if (existingUser) {
          currentUser = existingUser;
        } else {
          currentUser = {
            id: Math.random().toString(36).substr(2, 9),
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

      // 1. Criar/buscar cliente na Asaas
      const customer = await asaasService.createCustomer({
        name: formData.name,
        email: formData.email,
        cpfCnpj: formData.cpf.replace(/\D/g, ''),
        mobilePhone: formData.phone.replace(/\D/g, ''),
        postalCode: formData.postalCode.replace(/\D/g, ''),
        addressNumber: formData.addressNumber,
        externalReference: currentUser.id,
      });

      // 2. Criar cobrança baseada no método de pagamento
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Vencimento em 7 dias

      const totalValue = itemsToPurchase.reduce((s, it) => s + it.price, 0);

      if (paymentMethod === 'CREDIT_CARD_ONE' || paymentMethod === 'CREDIT_CARD_INSTALL') {
        const [expiryMonth, expiryYear] = formData.expiry.split('/');

        const payment = await asaasService.createCreditCardPayment({
          customer: customer.id,
          billingType: 'CREDIT_CARD',
          value: totalValue,
          dueDate: dueDate.toISOString().split('T')[0],
          description: itemsToPurchase.map((i) => i.title).join(' | '),
          externalReference: `${currentUser.id}-${course ? course.id : 'cart'}`,
          installmentCount: paymentMethod === 'CREDIT_CARD_INSTALL' && installmentCount > 1 ? installmentCount : undefined,
          creditCard: {
            holderName: formData.cardName,
            number: formData.cardNumber.replace(/\s/g, ''),
            expiryMonth,
            expiryYear: `20${expiryYear}`,
            ccv: formData.cvv,
          },
          creditCardHolderInfo: {
            name: formData.name,
            email: formData.email,
            cpfCnpj: formData.cpf.replace(/\D/g, ''),
            postalCode: formData.postalCode.replace(/\D/g, ''),
            addressNumber: formData.addressNumber,
            phone: formData.phone.replace(/\D/g, ''),
          },
        });

        if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
          itemsToPurchase.forEach((it) => purchaseCourse(currentUser.id, it.id));
          if (!course) clearCart();
          toast({ title: 'Pagamento Aprovado!', description: 'Você já pode acessar seus cursos.' });
          navigate('/aluno/dashboard');
        } else {
          toast({ title: 'Pagamento Processando', description: 'Pagamento em processamento. Você será notificado.' });
          navigate('/aluno/dashboard');
        }
      } else if (paymentMethod === 'PIX') {
        const payment = await asaasService.createPayment({
          customer: customer.id,
          billingType: 'PIX',
          value: totalValue,
          dueDate: dueDate.toISOString().split('T')[0],
          description: itemsToPurchase.map((i) => i.title).join(' | '),
          externalReference: `${currentUser.id}-${course ? course.id : 'cart'}`,
        });

        const pixData = await asaasService.getPixQrCode(payment.id);
        setPixQrCode(pixData.encodedImage);
        setPixCopyPaste(pixData.payload);

        toast({ title: 'PIX Gerado!', description: 'Escaneie o QR Code ou copie o código PIX para pagar.' });
      } else if (paymentMethod === 'BOLETO') {
        const payment = await asaasService.createPayment({
          customer: customer.id,
          billingType: 'BOLETO',
          value: totalValue,
          dueDate: dueDate.toISOString().split('T')[0],
          description: itemsToPurchase.map((i) => i.title).join(' | '),
          externalReference: `${currentUser.id}-${course ? course.id : 'cart'}`,
        });

        setBoletoUrl(payment.bankSlipUrl);
        const barcodeData = await asaasService.getBoletoIdentificationField(payment.id);
        setBoletoBarcode(barcodeData.identificationField);

        toast({ title: 'Boleto Gerado!', description: 'Você pode visualizar e pagar o boleto.' });
      }

      else if (paymentMethod === 'DEBIT_CARD') {
        const [expiryMonth, expiryYear] = formData.expiry.split('/');

        const payment = await asaasService.createDebitCardPayment({
          customer: customer.id,
          billingType: 'DEBIT_CARD',
          value: totalValue,
          dueDate: dueDate.toISOString().split('T')[0],
          description: itemsToPurchase.map((i) => i.title).join(' | '),
          externalReference: `${currentUser.id}-${course ? course.id : 'cart'}`,
          creditCard: {
            holderName: formData.cardName,
            number: formData.cardNumber.replace(/\s/g, ''),
            expiryMonth,
            expiryYear: `20${expiryYear}`,
            ccv: formData.cvv,
          },
          creditCardHolderInfo: {
            name: formData.name,
            email: formData.email,
            cpfCnpj: formData.cpf.replace(/\D/g, ''),
            postalCode: formData.postalCode.replace(/\D/g, ''),
            addressNumber: formData.addressNumber,
            phone: formData.phone.replace(/\D/g, ''),
          },
        });

        if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
          itemsToPurchase.forEach((it) => purchaseCourse(currentUser.id, it.id));
          if (!course) clearCart();
          toast({ title: 'Pagamento Aprovado!', description: 'Você já pode acessar seus cursos.' });
          navigate('/aluno/dashboard');
        } else {
          toast({ title: 'Pagamento Processando', description: 'Pagamento em processamento. Você será notificado.' });
          navigate('/aluno/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      toast({
        title: 'Erro no Pagamento',
        description: error.message || 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

    // Items to display in the summary (single course or cart items)
    const itemsToShow = course ? [course] : cartItems;
    const subtotalOriginal = itemsToShow.reduce((s, it) => s + Number(it.originalPrice ?? it.price ?? 0), 0);
    const subtotal = itemsToShow.reduce((s, it) => s + Number(it.price ?? 0), 0);
    const discountTotal = subtotalOriginal - subtotal;

    if (!course && itemsToShow.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-4">Carrinho vazio</h2>
            <p className="mb-6">Adicione cursos ao carrinho antes de finalizar a compra.</p>
            <Link to="/cursos" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white">
              Ver Cursos
            </Link>
          </div>
        </div>
      );
    }

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
            <span className="font-bold">Evoluciva</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg sticky top-8">
              <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

              {itemsToShow.length === 1 ? (
                (() => {
                  const it = itemsToShow[0];
                  return (
                    <>
                      <div className="flex gap-4 mb-6">
                        <img src={it.image} alt={it.title} className="w-24 h-16 object-cover rounded-lg" />
                        <div>
                          <h3 className="font-semibold line-clamp-2">{it.title}</h3>
                          <p className="text-sm text-muted-foreground">{it.instructor}</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm mb-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{it.duration} de conteúdo</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          <span>{it.lessons} aulas</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Shield className="w-4 h-4" />
                          <span>Garantia de 7 dias</span>
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="mb-4">
                  <ul className="space-y-4">
                    {itemsToShow.map((it) => (
                      <li key={it.id} className="flex items-center gap-4">
                        <img src={it.image} alt={it.title} className="w-20 h-12 object-cover rounded-md" />
                        <div className="flex-1">
                          <div className="font-medium">{it.title}</div>
                          <div className="text-sm text-muted-foreground">{it.instructor}</div>
                        </div>
                        <div className="font-semibold">R$ {Number(it.price ?? 0).toFixed(2)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground mb-2">
                  <span>Subtotal</span>
                  <span className="line-through">R$ {subtotalOriginal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-success mb-2">
                  <span>Desconto</span>
                  <span>-R$ {discountTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="gradient-text">R$ {subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Finalizar Compra</h2>
              <p className="text-muted-foreground mb-6">
                Escolha a forma de pagamento e preencha os dados
              </p>

              {!asaasService.isConfigured() && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive">
                    <strong>Configuração Pendente:</strong> O sistema de pagamento ainda não está configurado. Entre em contato com o suporte.
                  </div>
                </div>
              )}

              {asaasService.isSandbox() && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong>Modo Sandbox:</strong> Este é um ambiente de testes. Nenhuma cobrança real será feita.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados pessoais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Dados Pessoais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
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
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        type="text"
                        className="h-12 rounded-xl"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        className="h-12 rounded-xl"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="postalCode">CEP *</Label>
                      <Input
                        id="postalCode"
                        type="text"
                        className="h-12 rounded-xl"
                        placeholder="00000-000"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressNumber">Número *</Label>
                      <Input
                        id="addressNumber"
                        type="text"
                        className="h-12 rounded-xl"
                        placeholder="123"
                        value={formData.addressNumber}
                        onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Métodos de Pagamento */}
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-lg mb-4">Método de Pagamento</h3>
                  
                  <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
                    <div className="space-y-3">
                      {/* Top row: 2 columns for credit options */}
                      <TabsList className="grid w-full grid-cols-2 gap-2">
                        <TabsTrigger value="CREDIT_CARD_ONE" className="gap-2 flex items-center w-full justify-start">
                          <CreditCard className="w-4 h-4" />
                          <span>Cartão à vista</span>
                        </TabsTrigger>
                        <TabsTrigger value="CREDIT_CARD_INSTALL" className="gap-2 flex items-center w-full justify-start">
                          <CreditCard className="w-4 h-4" />
                          <span>Cartão parcelado</span>
                        </TabsTrigger>
                      </TabsList>

                      {/* Bottom row: 3 columns - Débito | PIX | Boleto */}
                      <TabsList className="grid w-full grid-cols-3 gap-2">
                        <TabsTrigger value="DEBIT_CARD" className="gap-2 flex items-center w-full justify-start col-span-1">
                          <CreditCard className="w-4 h-4" />
                          <span>Débito</span>
                        </TabsTrigger>
                        <TabsTrigger value="PIX" className="gap-2 flex items-center w-full justify-start col-span-1">
                          <QrCode className="w-4 h-4" />
                          <span>PIX</span>
                        </TabsTrigger>
                        <TabsTrigger value="BOLETO" className="gap-2 flex items-center w-full justify-start col-span-1">
                          <Barcode className="w-4 h-4" />
                          <span>Boleto</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Cartão à vista */}
                    <TabsContent value="CREDIT_CARD_ONE" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Nome no cartão *</Label>
                        <Input
                          id="cardName"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="Nome como está no cartão"
                          value={formData.cardName}
                          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                          required={paymentMethod === 'CREDIT_CARD_ONE'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Número do cartão *</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="0000 0000 0000 0000"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          required={paymentMethod === 'CREDIT_CARD_ONE'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Validade *</Label>
                          <Input
                            id="expiry"
                            type="text"
                            className="h-12 rounded-xl"
                            placeholder="MM/AA"
                            value={formData.expiry}
                            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                            required={paymentMethod === 'CREDIT_CARD_ONE'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            type="text"
                            className="h-12 rounded-xl"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                            required={paymentMethod === 'CREDIT_CARD_ONE'}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Cartão parcelado */}
                    <TabsContent value="CREDIT_CARD_INSTALL" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNameInstall">Nome no cartão *</Label>
                        <Input
                          id="cardNameInstall"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="Nome como está no cartão"
                          value={formData.cardName}
                          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                          required={paymentMethod === 'CREDIT_CARD_INSTALL'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumberInstall">Número do cartão *</Label>
                        <Input
                          id="cardNumberInstall"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="0000 0000 0000 0000"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          required={paymentMethod === 'CREDIT_CARD_INSTALL'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryInstall">Validade *</Label>
                          <Input
                            id="expiryInstall"
                            type="text"
                            className="h-12 rounded-xl"
                            placeholder="MM/AA"
                            value={formData.expiry}
                            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                            required={paymentMethod === 'CREDIT_CARD_INSTALL'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvvInstall">CVV *</Label>
                          <Input
                            id="cvvInstall"
                            type="text"
                            className="h-12 rounded-xl"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                            required={paymentMethod === 'CREDIT_CARD_INSTALL'}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="installments">Parcelas</Label>
                        <div className="relative inline-block">
                          <select
                            id="installments"
                            value={installmentCount}
                            onChange={(e) => setInstallmentCount(Number(e.target.value))}
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm w-40 appearance-none"
                          >
                            {Array.from({ length: 12 }).map((_, i) => {
                              const val = i + 1;
                              if (val < 2) return null;
                              return (
                                <option key={val} value={val}>{val}x</option>
                              );
                            })}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <ChevronDown className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Débito */}
                    <TabsContent value="DEBIT_CARD" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="debitName">Nome no cartão *</Label>
                        <Input
                          id="debitName"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="Nome como está no cartão"
                          value={formData.cardName}
                          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                          required={paymentMethod === 'DEBIT_CARD'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="debitNumber">Número do cartão *</Label>
                        <Input
                          id="debitNumber"
                          type="text"
                          className="h-12 rounded-xl"
                          placeholder="0000 0000 0000 0000"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          required={paymentMethod === 'DEBIT_CARD'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debitExpiry">Validade *</Label>
                          <Input
                            id="debitExpiry"
                            type="text"
                            className="h-12 rounded-xl"
                            placeholder="MM/AA"
                            value={formData.expiry}
                            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                            required={paymentMethod === 'DEBIT_CARD'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="debitCvv">CVV *</Label>
                          <Input
                            id="debitCvv"
                            type="text"
                            className="h-12 rounded-xl"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                            required={paymentMethod === 'DEBIT_CARD'}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* PIX */}
                    <TabsContent value="PIX" className="mt-4">
                      {pixQrCode ? (
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-xl flex justify-center">
                            <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-64 h-64" />
                          </div>
                          <div className="space-y-2">
                            <Label>Código PIX Copia e Cola</Label>
                            <div className="flex gap-2">
                              <Input
                                value={pixCopyPaste}
                                readOnly
                                className="font-mono text-xs"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pixCopyPaste);
                                  toast({ title: 'Código copiado!' });
                                }}
                              >
                                Copiar
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            Abra o app do seu banco e escaneie o QR Code ou use o código Pix
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Clique em "Gerar PIX" para criar o QR Code</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Boleto */}
                    <TabsContent value="BOLETO" className="mt-4">
                      {boletoUrl ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Código de Barras</Label>
                            <Input
                              value={boletoBarcode}
                              readOnly
                              className="font-mono text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => window.open(boletoUrl, '_blank')}
                            className="w-full"
                            variant="outline"
                          >
                            <Barcode className="w-4 h-4 mr-2" />
                            Visualizar Boleto
                          </Button>
                          <p className="text-sm text-muted-foreground text-center">
                            Pague o boleto em qualquer banco, lotérica ou app bancário
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Barcode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Clique em "Gerar Boleto" para criar a cobrança</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !asaasService.isConfigured()}
                  className="w-full h-14 gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold text-lg rounded-xl"
                >
                  {loading ? (
                      'Processando...'
                    ) : paymentMethod === 'CREDIT_CARD_ONE' ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Finalizar Compra - R$ {subtotal.toFixed(2)}
                      </>
                    ) : paymentMethod === 'CREDIT_CARD_INSTALL' ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Parcelado - {installmentCount}x - R$ {subtotal.toFixed(2)}
                      </>
                    ) : paymentMethod === 'PIX' ? (
                      <>
                        <QrCode className="w-5 h-5 mr-2" />
                        Gerar PIX - R$ {subtotal.toFixed(2)}
                      </>
                    ) : paymentMethod === 'DEBIT_CARD' ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Débito - R$ {subtotal.toFixed(2)}
                      </>
                    ) : (
                      <>
                        <Barcode className="w-5 h-5 mr-2" />
                        Gerar Boleto - R$ {subtotal.toFixed(2)}
                      </>
                    )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Pagamento 100% seguro via Asaas</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
