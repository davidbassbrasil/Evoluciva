/**
 * Checkout Page - Integrado com Asaas
 * Suporta: Cartão de Crédito, PIX e Boleto
 * @updated 2025-12-10 - Integração com sistema de turmas
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
import type { Turma, User } from '@/types';
import supabase from '@/lib/supabaseClient';
import logoPng from '@/assets/logo_.png';
import { todayKeyBR, formatBRDateTime } from '@/lib/dates';

// Retorna timestamp ISO em UTC (ex: "2025-12-29T17:30:45.000Z") - consistente para armazenamento no DB
const getLocalTimestamp = (): string => {
  return new Date().toISOString();
};

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [turmaModality, setTurmaModality] = useState<'presential' | 'online'>('presential');
  const [cartItems, setCartItems] = useState<Array<{ turma: Turma; modality: 'presential' | 'online' }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD_ONE' | 'CREDIT_CARD_INSTALL' | 'DEBIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD_ONE');
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [pixCopyPaste, setPixCopyPaste] = useState<string>('');
  const [pixExpiresAt, setPixExpiresAt] = useState<Date | null>(null);
  const [pixTimeRemaining, setPixTimeRemaining] = useState<string>('');
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

  // Helper: human-friendly label for the selected payment method
  const getPaymentMethodLabel = (method: typeof paymentMethod) => {
    switch (method) {
      case 'CREDIT_CARD_ONE':
        return 'Cartão à vista';
      case 'CREDIT_CARD_INSTALL':
        return installmentCount > 1 ? `Cartão parcelado (${installmentCount}x)` : 'Cartão parcelado';
      case 'DEBIT_CARD':
        return 'Débito';
      case 'PIX':
        return 'PIX';
      case 'BOLETO':
        return 'Boleto';
      default:
        return String(method);
    }
  };
  // Coupon state
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    turmaId?: string | null;
  } | null>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Contador de tempo do PIX
  useEffect(() => {
    if (!pixExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = pixExpiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setPixTimeRemaining('Expirado');
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setPixTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [pixExpiresAt]);

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
          // Single turma checkout (format: courseId:turmaId:modality)
          const parts = courseId.split(':');
          const turmaId = parts[1];
          const modality = (parts[2] || 'presential') as 'presential' | 'online';
          
          if (!turmaId) {
            toast({ title: 'Erro', description: 'Turma não especificada', variant: 'destructive' });
            navigate('/');
            return;
          }

          setTurmaModality(modality);

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
            .eq('id', turmaId)
            .single();

          if (error || !data) {
            toast({ title: 'Erro', description: 'Turma não encontrada', variant: 'destructive' });
            navigate('/');
            return;
          }
          
          // Verificar se turma está disponível para venda
          if (data.status !== 'active') {
            toast({ title: 'Turma indisponível', description: 'Esta turma não está disponível no momento.', variant: 'destructive' });
            navigate('/');
            return;
          }
          
          // Verificar datas de venda
          const now = new Date();
          if (data.sale_start_date && now < new Date(data.sale_start_date)) {
            toast({ title: 'Vendas não iniciadas', description: 'As vendas para esta turma ainda não começaram.', variant: 'destructive' });
            navigate('/');
            return;
          }
          if (data.sale_end_date && now > new Date(data.sale_end_date)) {
            toast({ title: 'Vendas encerradas', description: 'O período de vendas desta turma foi encerrado.', variant: 'destructive' });
            navigate('/');
            return;
          }
          
          // Verificar se a turma já expirou completamente
          if (data.access_end_date && now > new Date(data.access_end_date)) {
            toast({ title: 'Turma encerrada', description: 'Esta turma não está mais disponível.', variant: 'destructive' });
            navigate('/');
            return;
          }
          
          setTurma(data);
          
          // Definir método de pagamento padrão baseado nas opções da turma
          if (data.allow_pix) {
            setPaymentMethod('PIX');
          } else if (data.allow_credit_card) {
            setPaymentMethod(data.allow_installments ? 'CREDIT_CARD_INSTALL' : 'CREDIT_CARD_ONE');
          } else if (data.allow_debit_card) {
            setPaymentMethod('DEBIT_CARD');
          } else if (data.allow_boleto) {
            setPaymentMethod('BOLETO');
          }
          
          // Carregar preço opcional vigente para esta turma (single checkout)
          try {
            const today = todayKeyBR();
            const { data: precoData, error: precoError } = await supabase
              .from('turma_precos_opcionais')
              .select('*')
              .eq('turma_id', data.id)
              .gte('expires_at', today)
              .in('channel', ['both', modality])
              .order('expires_at', { ascending: true })
              .limit(1);
            if (!precoError && precoData && precoData.length > 0) {
              const p = precoData[0];
              if (p.channel === 'both' || p.channel === 'presential') data._effective_price_presential = Number(p.price);
              if (p.channel === 'both' || p.channel === 'online') data._effective_price_online = Number(p.price);
            }
          } catch (err) {
            // falha ao carregar preço opcional — continuar sem preço opcional
          }

          // Não setar installmentCount automaticamente, deixar o padrão (1)
        } else {
          // Cart checkout
          const cartItemIds = getCart();
          if (cartItemIds.length === 0) {
            toast({ title: 'Carrinho vazio', description: 'Adicione cursos antes de finalizar a compra.' });
            navigate('/cursos');
            return;
          }

          // Extrair turmaIds e modality do formato courseId:turmaId:modality
          const parsedItems = cartItemIds
            .map(item => {
              const parts = item.split(':');
              return {
                turmaId: parts[1],
                modality: (parts[2] || 'presential') as 'presential' | 'online'
              };
            })
            .filter(item => item.turmaId);

          if (parsedItems.length === 0) {
            toast({ title: 'Erro', description: 'Nenhuma turma válida no carrinho.' });
            navigate('/cart');
            return;
          }

          const turmaIds = parsedItems.map(item => item.turmaId);

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
            // Filtrar turmas disponíveis
            const availableTurmas = data.filter((t: any) => {
              if (t.status !== 'active') return false;
              
              const now = new Date();
              if (t.sale_start_date && now < new Date(t.sale_start_date)) return false;
              if (t.sale_end_date && now > new Date(t.sale_end_date)) return false;
              
              return true;
            });
            
            if (availableTurmas.length === 0) {
              toast({ title: 'Nenhuma turma disponível', description: 'As turmas do carrinho não estão mais disponíveis.' });
              navigate('/cart');
              return;
            }
            
            // Carregar preços opcionais para as turmas do carrinho e associar modality
            try {
              const turmaIdsUnique = Array.from(new Set(turmaIds));
              const today = todayKeyBR();
              const { data: precos, error: precosError } = await supabase
                .from('turma_precos_opcionais')
                .select('*')
                .in('turma_id', turmaIdsUnique)
                .gte('expires_at', today)
                .order('expires_at', { ascending: true });

              const precoMap: Record<string, { presential?: any; online?: any }> = {};
              (precos || []).forEach((p: any) => {
                const id = p.turma_id;
                if (!precoMap[id]) precoMap[id] = {};
                if (p.channel === 'both') {
                  if (!precoMap[id].presential) precoMap[id].presential = p;
                  if (!precoMap[id].online) precoMap[id].online = p;
                } else if (p.channel === 'presential') {
                  if (!precoMap[id].presential) precoMap[id].presential = p;
                } else if (p.channel === 'online') {
                  if (!precoMap[id].online) precoMap[id].online = p;
                }
              });

              // Ordenar conforme carrinho e associar modality, aplicando preços opcionais quando existirem
              const orderedTurmas = parsedItems
                .map(({ turmaId, modality }) => {
                  const turma = availableTurmas.find((t: any) => t.id === turmaId);
                  if (!turma) return null;
                  const mapEntry = precoMap[turma.id];
                  if (mapEntry) {
                    if (mapEntry.presential) turma._effective_price_presential = Number(mapEntry.presential.price);
                    if (mapEntry.online) turma._effective_price_online = Number(mapEntry.online.price);
                  }
                  return turma ? { turma, modality } : null;
                })
                .filter(Boolean) as Array<{ turma: Turma; modality: 'presential' | 'online' }>;

              setCartItems(orderedTurmas);
            } catch (err) {
              // falha ao carregar preços opcionais do carrinho — usar preços originais
              // Mesmo se falhar, continuar com preços originais
              const orderedTurmasFallback = parsedItems
                .map(({ turmaId, modality }) => {
                  const turma = availableTurmas.find((t: any) => t.id === turmaId);
                  return turma ? { turma, modality } : null;
                })
                .filter(Boolean) as Array<{ turma: Turma; modality: 'presential' | 'online' }>;
              setCartItems(orderedTurmasFallback);
            }
          }
        }
      } catch (err) {
        toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
        navigate('/');
      }
    };

    loadCourseData();
  }, [courseId, navigate, toast]);

  const createEnrollmentsForPayment = async (
    userId: string,
    items: Array<{ turma: Turma; modality: 'presential' | 'online' }>,
    paymentId?: string,
    enrolledAt?: string,
    enrollmentStatus: 'active' | 'pending' | 'waiting_payment' = 'active'
  ) => {
    const ts = enrolledAt || getLocalTimestamp();
    try {
      for (const item of items) {
        // verificar se já existe matrícula ativa ou pendente
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('profile_id', userId)
          .eq('turma_id', item.turma.id)
          .maybeSingle();

        if (!existingEnrollment) {
          const enrollmentData: any = {
            profile_id: userId,
            turma_id: item.turma.id,
            payment_status: enrollmentStatus === 'active' ? 'paid' : 'pending',
            enrolled_at: ts,
            modality: item.modality,
          };
          if (paymentId) enrollmentData.payment_id = paymentId;
          if (enrollmentData.payment_status === 'paid') {
            enrollmentData.paid_at = ts;
          }

          const { error: enrollError } = await supabase.from('enrollments').insert(enrollmentData);
          if (enrollError) {
            console.error('[checkout] Error creating enrollment:', enrollError);
          } else {
            console.log(`[checkout] Enrollment created for profile ${userId} turma ${item.turma.id} (status=${enrollmentData.payment_status})`);
          }
        }
      }
      // Nota: não limpar o carrinho aqui — quem chamar deve decidir quando limpar (apenas quando matrícula ativa)
    } catch (e) {
      // erro no fluxo de criação de matrículas
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Determine items to purchase and total
    const itemsToPurchase = turma ? [{ turma, modality: turmaModality }] : cartItems;
    if (!turma && itemsToPurchase.length === 0) {
      toast({ title: 'Carrinho vazio', description: 'Adicione cursos antes de finalizar a compra.' });
      return;
    }
    
    // Verificar se método de pagamento é permitido pela turma
    const firstItem = itemsToPurchase[0];
    const firstTurma = firstItem.turma;
    if (firstTurma) {
      if (paymentMethod === 'PIX' && !firstTurma.allow_pix) {
        toast({ title: 'Método não permitido', description: 'PIX não está disponível para esta turma.', variant: 'destructive' });
        return;
      }
      if (paymentMethod === 'BOLETO' && !firstTurma.allow_boleto) {
        toast({ title: 'Método não permitido', description: 'Boleto não está disponível para esta turma.', variant: 'destructive' });
        return;
      }
      if ((paymentMethod === 'CREDIT_CARD_ONE' || paymentMethod === 'CREDIT_CARD_INSTALL') && !firstTurma.allow_credit_card) {
        toast({ title: 'Método não permitido', description: 'Cartão de crédito não está disponível para esta turma.', variant: 'destructive' });
        return;
      }
      if (paymentMethod === 'CREDIT_CARD_INSTALL' && !firstTurma.allow_installments) {
        toast({ title: 'Método não permitido', description: 'Parcelamento não está disponível para esta turma.', variant: 'destructive' });
        return;
      }
      if (paymentMethod === 'DEBIT_CARD' && !firstTurma.allow_debit_card) {
        toast({ title: 'Método não permitido', description: 'Cartão de débito não está disponível para esta turma.', variant: 'destructive' });
        return;
      }
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
      // Deixar o Asaas decidir o agendamento da cobrança; usamos a data atual como fallback.
      const formatDateLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      // Calcular total com desconto por método de pagamento
      let totalValue = itemsToPurchase.reduce((s, item) => {
        const price = item.modality === 'online'
          ? Number(item.turma._effective_price_online ?? item.turma.price_online ?? 0)
          : Number(item.turma._effective_price_presential ?? item.turma.price ?? 0);
        return s + price;
      }, 0);

      // Aplicar desconto de cupom, se aplicado
      if (appliedCoupon) {
        // Se o cupom está associado a uma turma específica, aplica apenas nela
        if (appliedCoupon.turmaId) {
          const match = itemsToPurchase.find(i => i.turma.id === appliedCoupon.turmaId);
            if (match) {
            const price = match.modality === 'online' ? Number(match.turma._effective_price_online ?? match.turma.price_online ?? 0) : Number(match.turma._effective_price_presential ?? match.turma.price ?? 0);
            const cupomDiscount = price * (appliedCoupon.discount / 100);
            totalValue -= cupomDiscount;
          }
        } else {
          // Aplica desconto percentual sobre o total
          totalValue -= totalValue * (appliedCoupon.discount / 100);
        }
      }

      // Se o total é zero ou menor, finalizar matrícula sem passar pelo gateway
      if (totalValue <= 0) {
        // Registrar matrícula localmente e limpar carrinho
        itemsToPurchase.forEach((item) => {
          purchaseCourse(currentUser!.id, item.turma.course_id || item.turma.course?.id);
        });
        if (!turma) clearCart();
        toast({ title: 'Matrícula concluída', description: 'Seu acesso foi liberado gratuitamente.', variant: 'default' });
        navigate('/aluno/dashboard');
        setLoading(false);
        return;
      }
      
      // Aplicar desconto baseado no método de pagamento (apenas primeira turma se cart)
      const firstItemForDiscount = itemsToPurchase[0];
      const turmaForDiscount = firstItemForDiscount?.turma;
      if (turmaForDiscount) {
        if (paymentMethod === 'CREDIT_CARD_ONE' && turmaForDiscount.discount_cash > 0) {
          const discount = Number(turmaForDiscount.discount_cash) || 0;
          totalValue -= discount;
        } else if (paymentMethod === 'PIX' && turmaForDiscount.discount_pix > 0) {
          const discount = Number(turmaForDiscount.discount_pix) || 0;
          totalValue -= discount;
        } else if (paymentMethod === 'DEBIT_CARD' && turmaForDiscount.discount_debit > 0) {
          const discount = Number(turmaForDiscount.discount_debit) || 0;
          totalValue -= discount;
        }
      }

      if (paymentMethod === 'CREDIT_CARD_ONE' || paymentMethod === 'CREDIT_CARD_INSTALL') {
        const [expiryMonth, expiryYear] = formData.expiry.split('/');

        const paymentData: any = {
          customer: customer.id,
          billingType: 'CREDIT_CARD',
          description: itemsToPurchase.map((item) => `${item.turma.course?.title} - ${item.turma.name} (${item.modality === 'online' ? 'Online' : 'Presencial'})`).join(' | '),
          externalReference: `${currentUser.id}-${turma ? turma.id : 'cart'}`,
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
        };

        // Adicionar campos de parcelamento se for pagamento parcelado
        if (paymentMethod === 'CREDIT_CARD_INSTALL' && installmentCount > 1) {
          paymentData.installmentCount = installmentCount;
          // Enviar `totalValue` para o Asaas fazer a divisão e compensar arredondamentos
          paymentData.totalValue = Number(totalValue.toFixed(2));
        } else {
          // Pagamento à vista — enviar `value`
          paymentData.value = Number(totalValue.toFixed(2));
        }

        const sanitizePaymentDataForLog = (pd: any) => {
          try {
            const copy: any = { ...pd };
            if (copy.creditCard) {
              const num = String(copy.creditCard.number || '');
              const digits = num.replace(/\D/g, '');
              const last4 = digits.slice(-4);
              copy.creditCard = { ...copy.creditCard, number: last4 ? `**** **** **** ${last4}` : undefined, ccv: '***' };
            }
            if (copy.creditCardHolderInfo && copy.creditCardHolderInfo.cpfCnpj) {
              const cpf = String(copy.creditCardHolderInfo.cpfCnpj).replace(/\D/g, '');
              copy.creditCardHolderInfo = { ...copy.creditCardHolderInfo, cpfCnpj: cpf.replace(/.(?=.{3})/g, '*') };
            }
            return copy;
          } catch (e) {
            return { sanitized: true };
          }
        };
        // Dados do cartão preparados para envio (mascarados)

        // Include due date in payment sent to Asaas (use today's date)
        paymentData.dueDate = formatDateLocal(dueDate);

        // Add installment info for Asaas when using installment payment
        if (paymentMethod === 'CREDIT_CARD_INSTALL' && installmentCount > 1) {
          paymentData.installmentCount = installmentCount;
          paymentData.installmentValue = Number((totalValue / installmentCount).toFixed(2));
        } else {
          paymentData.value = Number(totalValue.toFixed(2));
        }

        const payment = await asaasService.createCreditCardPayment(paymentData);

        if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
          // Buscar usuário autenticado do Supabase
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const userId = authUser?.id || currentUser.id;

          // Registrar timestamps em horário local BR (para garantir consistência nos relatórios)
          const localTimestamp = getLocalTimestamp();

          const { data: paymentRecord, error: paymentError } = await supabase.from('payments').insert({
            asaas_payment_id: payment.id,
            user_id: userId,
            turma_id: itemsToPurchase[0].turma.id,
            value: totalValue,
            status: payment.status === 'CONFIRMED' ? 'CONFIRMED' : 'RECEIVED',
            billing_type: paymentMethod === 'CREDIT_CARD_INSTALL' ? 'CREDIT_CARD_INSTALLMENT' : 'CREDIT_CARD',
            installment_count: installmentCount > 1 ? installmentCount : null,
            due_date: formatDateLocal(dueDate),
            payment_date: localTimestamp,
            confirmed_date: localTimestamp,
            description: paymentData.description,
            metadata: { ...payment, items: itemsToPurchase.map(i => ({ turma_id: i.turma.id, modality: i.modality })) },
          }).select().single();

          if (paymentError) {
            toast({ title: 'Erro ao registrar pagamento', description: 'Ocorreu um erro ao salvar o pagamento. Contate o suporte.', variant: 'destructive' });
          }

          // Cancelar pagamentos pendentes anteriores para as mesmas turmas
          const turmaIds = itemsToPurchase.map(item => item.turma.id);
          // Cancelar pagamentos pendentes anteriores para as mesmas turmas

          // Primeiro, verificar se existem pagamentos pendentes
          const { data: pendingPayments, error: checkError } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .in('turma_id', turmaIds)
            .eq('status', 'PENDING')
            .neq('id', paymentRecord?.id);

          if (checkError) {
            toast({ title: 'Erro', description: 'Não foi possível verificar pagamentos pendentes.', variant: 'destructive' });
          }

          const { data: canceledPayments, error: cancelError } = await supabase
            .from('payments')
            .update({ status: 'CANCELLED' })
            .eq('user_id', userId)
            .in('turma_id', turmaIds)
            .eq('status', 'PENDING')
            .neq('id', paymentRecord?.id)
            .select();

          if (cancelError) {
            toast({ title: 'Erro', description: 'Não foi possível cancelar pagamentos pendentes.', variant: 'destructive' });
          }

          // Criar matrículas imediatamente para pagamentos confirmados
          await createEnrollmentsForPayment(userId, itemsToPurchase, paymentRecord?.id, localTimestamp);
          if (!turma) clearCart();

          toast({ title: 'Pagamento confirmado!', description: 'Sua matrícula foi liberada. Acesse o dashboard para começar.' });
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
          dueDate: formatDateLocal(dueDate),
          description: itemsToPurchase.map((item) => `${item.turma.course?.title} - ${item.turma.name} (${item.modality === 'online' ? 'Online' : 'Presencial'})`).join(' | '),
          externalReference: `${currentUser.id}-${turma ? turma.id : 'cart'}`,
        });

        const pixData = await asaasService.getPixQrCode(payment.id);
        setPixQrCode(pixData.encodedImage);
        setPixCopyPaste(pixData.payload);
        
        // PIX expira em 30 minutos
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        setPixExpiresAt(expiresAt);

        // Criar registro do pagamento na tabela payments
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userId = authUser?.id || currentUser.id;

        const pixStatus = payment?.status === 'CONFIRMED' ? 'CONFIRMED' : payment?.status === 'RECEIVED' ? 'RECEIVED' : 'PENDING';

        const { data: pixPaymentRecord, error: pixPaymentError } = await supabase.from('payments').insert({
          asaas_payment_id: payment.id,
          user_id: userId,
          turma_id: itemsToPurchase[0].turma.id,
          value: totalValue,
          status: pixStatus,
          billing_type: 'PIX',
          due_date: payment?.dueDate || formatDateLocal(dueDate),
          description: itemsToPurchase.map((item) => `${item.turma.course?.title} - ${item.turma.name}`).join(' | '),
          metadata: { ...payment, items: itemsToPurchase.map(i => ({ turma_id: i.turma.id, modality: i.modality })) },
        }).select().single();

        const localTimestamp = getLocalTimestamp();
        const enrollStatus = (pixStatus === 'CONFIRMED' || pixStatus === 'RECEIVED') ? 'active' : 'pending';

        // Criar matrícula imediatamente (pending ou active)
        await createEnrollmentsForPayment(userId, itemsToPurchase, pixPaymentRecord?.id || undefined, localTimestamp, enrollStatus);

        if (enrollStatus === 'active') {
          if (!turma) clearCart();
          toast({ title: 'Pagamento confirmado!', description: 'Sua matrícula foi liberada. Acesse o dashboard para começar.' });
          navigate('/aluno/dashboard');
        } else {
          toast({ title: 'PIX Gerado!', description: 'Escaneie o QR Code ou copie o código PIX para pagar.' });
        }
      } else if (paymentMethod === 'BOLETO') {
        const payment = await asaasService.createPayment({
          customer: customer.id,
          billingType: 'BOLETO',
          value: totalValue,
          dueDate: formatDateLocal(dueDate),
          description: itemsToPurchase.map((item) => `${item.turma.course?.title} - ${item.turma.name} (${item.modality === 'online' ? 'Online' : 'Presencial'})`).join(' | '),
          externalReference: `${currentUser.id}-${turma ? turma.id : 'cart'}`,
        });

        setBoletoUrl(payment.bankSlipUrl);
        const barcodeData = await asaasService.getBoletoIdentificationField(payment.id);
        setBoletoBarcode(barcodeData.identificationField);

        // Criar registro do pagamento na tabela payments
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userId = authUser?.id || currentUser.id;

        const boletoStatus = payment?.status === 'CONFIRMED' ? 'CONFIRMED' : payment?.status === 'RECEIVED' ? 'RECEIVED' : 'PENDING';

        const { data: boletoPaymentRecord, error: boletoPaymentError } = await supabase.from('payments').insert({
          asaas_payment_id: payment.id,
          user_id: userId,
          turma_id: itemsToPurchase[0].turma.id,
          value: totalValue,
          status: boletoStatus,
          billing_type: 'BOLETO',
          due_date: payment?.dueDate || formatDateLocal(dueDate),
          description: itemsToPurchase.map((item) => `${item.turma.course?.title} - ${item.turma.name}`).join(' | '),
          metadata: { ...payment, items: itemsToPurchase.map(i => ({ turma_id: i.turma.id, modality: i.modality })) },
        }).select().single();

        const localTimestamp = getLocalTimestamp();
        const enrollStatus = (boletoStatus === 'CONFIRMED' || boletoStatus === 'RECEIVED') ? 'active' : 'pending';

        // Criar matrícula imediatamente (pending ou active)
        await createEnrollmentsForPayment(userId, itemsToPurchase, boletoPaymentRecord?.id || undefined, localTimestamp, enrollStatus);

        if (enrollStatus === 'active') {
          if (!turma) clearCart();
          toast({ title: 'Pagamento confirmado!', description: 'Sua matrícula foi liberada. Acesse o dashboard para começar.' });
          navigate('/aluno/dashboard');
        } else {
          toast({ title: 'Boleto Gerado!', description: 'Você pode visualizar e pagar o boleto.' });
        }
      }

      else if (paymentMethod === 'DEBIT_CARD') {
        const [expiryMonth, expiryYear] = formData.expiry.split('/');

        const payment = await asaasService.createDebitCardPayment({
          customer: customer.id,
          billingType: 'CREDIT_CARD' as any, // Asaas usa CREDIT_CARD para débito também
          value: totalValue,
          dueDate: formatDateLocal(dueDate),
          description: itemsToPurchase.map((item) => `${item.turma.course?.title} - ${item.turma.name} (${item.modality === 'online' ? 'Online' : 'Presencial'})`).join(' | '),
          externalReference: `${currentUser.id}-${turma ? turma.id : 'cart'}`,
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
          // Registrar pagamento no banco
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const userId = authUser?.id || currentUser.id;

          const localTimestamp = getLocalTimestamp();

          const { data: paymentRecord, error: paymentError } = await supabase.from('payments').insert({
            asaas_payment_id: payment.id,
            user_id: userId,
            turma_id: itemsToPurchase[0].turma.id,
            value: totalValue,
            status: payment.status === 'CONFIRMED' ? 'CONFIRMED' : 'RECEIVED',
            billing_type: 'DEBIT_CARD',
            due_date: formatDateLocal(dueDate),
            payment_date: localTimestamp,
            confirmed_date: localTimestamp,
            description: itemsToPurchase.map((item) => `${item.turma.course?.title} - ${item.turma.name} (${item.modality === 'online' ? 'Online' : 'Presencial'})`).join(' | '),
            metadata: { ...payment, items: itemsToPurchase.map(i => ({ turma_id: i.turma.id, modality: i.modality })) },
          }).select().single();

          if (paymentError) {
            toast({ title: 'Erro ao registrar pagamento', description: 'Não foi possível salvar o pagamento. Contate o suporte.', variant: 'destructive' });
          } else {
            // Cancelar pagamentos pendentes anteriores para as mesmas turmas
            const turmaIds = itemsToPurchase.map(item => item.turma.id);

            const { error: cancelError } = await supabase
              .from('payments')
              .update({ status: 'CANCELLED' })
              .eq('user_id', userId)
              .in('turma_id', turmaIds)
              .eq('status', 'PENDING')
              .neq('id', paymentRecord?.id);

            if (cancelError) {
              toast({ title: 'Erro', description: 'Não foi possível cancelar pagamentos pendentes.', variant: 'destructive' });
            }

            // Criar matrículas imediatamente para pagamento confirmado
            await createEnrollmentsForPayment(userId, itemsToPurchase, paymentRecord?.id, localTimestamp);
            if (!turma) clearCart();

            toast({ title: 'Pagamento confirmado!', description: 'Sua matrícula foi liberada. Acesse o dashboard para começar.' });
            navigate('/aluno/dashboard');
          }
        } else {
          toast({ title: 'Pagamento Processando', description: 'Pagamento em processamento. Você será notificado.' });
          navigate('/aluno/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro no Pagamento',
        description: error?.message || 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Informe o código do cupom');
      return;
    }

    const items = turma ? [{ turma, modality: turmaModality }] : cartItems;
    // Encontrar primeira turma que possua este cupom
    const match = items.find(i => (i.turma.coupon_code || '').toUpperCase() === code);
    if (match) {
      setAppliedCoupon({ code, discount: Number(match.turma.coupon_discount || 0), turmaId: match.turma.id });
      toast({ title: 'Cupom aplicado', description: `Cupom ${code} aplicado (${match.turma.coupon_discount}% off)` });
      return;
    }

    setCouponError('Cupom inválido ou não aplicável para este pedido');
    setAppliedCoupon(null);
  };

    // Items to display in the summary (single turma or cart items)
    const itemsToShow = turma ? [{ turma, modality: turmaModality }] : cartItems;
    
    const subtotalOriginal = itemsToShow.reduce((s, item) => {
      const originalPrice = item.modality === 'online'
        ? Number(item.turma.original_price_online ?? item.turma.price_online ?? 0)
        : Number(item.turma.original_price ?? item.turma.price ?? 0);
      return s + originalPrice;
    }, 0);
    
    const subtotalBase = itemsToShow.reduce((s, item) => {
      const price = item.modality === 'online'
        ? Number(item.turma._effective_price_online ?? item.turma.price_online ?? 0)
        : Number(item.turma._effective_price_presential ?? item.turma.price ?? 0);
      return s + price;
    }, 0);
    
    // Aplicar desconto por método de pagamento (apenas primeira turma)
    let paymentDiscount = 0;
    const firstItem = itemsToShow[0];
    const firstTurma = firstItem?.turma;
    if (firstTurma) {
      if (paymentMethod === 'CREDIT_CARD_ONE' && firstTurma.discount_cash > 0) {
        paymentDiscount = Number(firstTurma.discount_cash) || 0;
      } else if (paymentMethod === 'PIX' && firstTurma.discount_pix > 0) {
        paymentDiscount = Number(firstTurma.discount_pix) || 0;
      } else if (paymentMethod === 'DEBIT_CARD' && firstTurma.discount_debit > 0) {
        paymentDiscount = Number(firstTurma.discount_debit) || 0;
      }
    }
    // Aplicar desconto de cupom (se aplicável)
    let couponDiscount = 0;
    if (appliedCoupon) {
      // Se associado a turma específica
      if (appliedCoupon.turmaId) {
        const match = itemsToShow.find(i => i.turma.id === appliedCoupon.turmaId);
        if (match) {
          const price = match.modality === 'online'
            ? Number(match.turma._effective_price_online ?? match.turma.price_online ?? 0)
            : Number(match.turma._effective_price_presential ?? match.turma.price ?? 0);
          couponDiscount = price * (appliedCoupon.discount / 100);
        }
      } else {
        couponDiscount = subtotalBase * (appliedCoupon.discount / 100);
      }
    }

    const subtotal = subtotalBase - paymentDiscount - couponDiscount;
    const discountTotal = subtotalOriginal - subtotalBase + couponDiscount;

    if (!turma && itemsToShow.length === 0) {
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
      <header className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <Link to="/" className="flex items-center gap-2">
              <img src={logoPng} alt="Logo" className="h-8" />
              <span className="font-bold"></span>
            </Link>
          </div>
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
                  const item = itemsToShow[0];
                  const displayPrice = item.modality === 'online'
                    ? Number(item.turma._effective_price_online ?? item.turma.price_online ?? 0)
                    : Number(item.turma._effective_price_presential ?? item.turma.price ?? 0);
                  const displayOriginalPrice = item.modality === 'online'
                    ? Number(item.turma.original_price_online ?? item.turma.price_online ?? 0)
                    : Number(item.turma.original_price ?? item.turma.price ?? 0);
                  
                  return (
                    <>
                      <div className="flex gap-4 mb-6">
                        <img src={item.turma.course?.image} alt={item.turma.course?.title} className="w-20 h-28 object-cover rounded-lg" />
                        <div className="flex-1">
                          <h3 className="font-semibold line-clamp-2 mb-1">{item.turma.course?.title}</h3>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span>{item.turma.name}</span>
                            <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                              {item.modality === 'online' ? 'Online' : 'Presencial'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.turma.course?.instructor}</p>
                          {item.turma.course?.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.turma.course.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-muted-foreground">Valor</span>
                        <div className="text-right">
                          {displayOriginalPrice > displayPrice && (
                            <div className="text-xs text-muted-foreground line-through">
                              R$ {displayOriginalPrice.toFixed(2)}
                            </div>
                          )}
                          <div className="text-lg font-semibold">R$ {displayPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="mb-4">
                  <ul className="space-y-4">
                    {itemsToShow.map((item) => {
                      const displayPrice = item.modality === 'online'
                        ? Number(item.turma._effective_price_online ?? item.turma.price_online ?? 0)
                        : Number(item.turma._effective_price_presential ?? item.turma.price ?? 0);
                      const displayOriginalPrice = item.modality === 'online'
                        ? Number(item.turma.original_price_online ?? item.turma.price_online ?? 0)
                        : Number(item.turma.original_price ?? item.turma.price ?? 0);
                      
                      return (
                        <li key={item.turma.id} className="flex items-start gap-4">
                          <img src={item.turma.course?.image} alt={item.turma.course?.title} className="w-16 h-22 object-cover rounded-md" />
                          <div className="flex-1">
                            <div className="font-medium mb-1">{item.turma.course?.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                              <span>{item.turma.name}</span>
                              <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                                {item.modality === 'online' ? 'Online' : 'Presencial'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-1">{item.turma.course?.instructor}</div>
                            {item.turma.course?.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">{item.turma.course.description}</div>
                            )}
                          </div>
                          <div className="text-right">
                            {displayOriginalPrice > displayPrice && (
                              <div className="text-xs text-muted-foreground line-through">
                                R$ {displayOriginalPrice.toFixed(2)}
                              </div>
                            )}
                            <div className="font-semibold">R$ {displayPrice.toFixed(2)}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="border-t border-border pt-4">
                {discountTotal > 0 && (
                  <>
                    <div className="flex justify-between text-muted-foreground mb-2">
                      <span>Subtotal Original</span>
                      <span className="line-through">R$ {subtotalOriginal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-success mb-2">
                      <span>Desconto</span>
                      <span>-R$ {discountTotal.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {paymentDiscount > 0 && (
                  <div className="flex justify-between text-success mb-2">
                    <span>Desconto {paymentMethod === 'PIX' ? 'PIX' : paymentMethod === 'DEBIT_CARD' ? 'Débito' : 'à Vista'}</span>
                    <span>-R$ {paymentDiscount.toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-success mb-2">
                    <span>Desconto (cupom: {appliedCoupon.code})</span>
                    <span>-R$ { ( (itemsToShow.find(i => i.turma.id === appliedCoupon.turmaId)?.modality === 'online') ?
                      (Number(itemsToShow.find(i => i.turma.id === appliedCoupon.turmaId)?.turma.price_online ?? 0) * (appliedCoupon.discount/100)) :
                      (Number(itemsToShow.find(i => i.turma.id === appliedCoupon.turmaId)?.turma.price ?? 0) * (appliedCoupon.discount/100))
                    ).toFixed(2)}</span>
                  </div>
                )}
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
                        maxLength={9}
                        value={formData.postalCode}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 5) {
                            value = value.slice(0, 5) + '-' + value.slice(5, 8);
                          }
                          setFormData({ ...formData, postalCode: value });
                        }}
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
                {/* Cupom de desconto */}
                <div className="mt-4 mb-6">
                  <h3 className="font-semibold text-lg">Cupom de Desconto</h3>
                  <div className="flex gap-3 mt-3">
                    <Input
                      id="coupon"
                      type="text"
                      className="h-12 rounded-xl"
                      placeholder="Código (ex: PROMO50)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <Button type="button" className="h-12" onClick={handleApplyCoupon}>Aplicar</Button>
                  </div>
                  {couponError && <div className="text-sm text-destructive mt-2">{couponError}</div>}
                  {appliedCoupon && (
                    <div className="text-sm text-success mt-2">Cupom <strong>{appliedCoupon.code}</strong> aplicado: -{appliedCoupon.discount}%</div>
                  )}
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-lg mb-4">Método de Pagamento</h3>
                  
<Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
                    <div className="space-y-3">
                      {/* Top row: Opções de crédito (se permitido) */}
                      {(firstTurma?.allow_credit_card || firstTurma?.allow_installments) && (
                        <TabsList className="flex flex-col sm:grid sm:grid-cols-2 gap-2 h-auto">
                          {firstTurma?.allow_credit_card && (
                            <TabsTrigger value="CREDIT_CARD_ONE" className="gap-2 flex items-center w-full justify-start h-auto py-3 px-4">
                              <CreditCard className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">Cartão à vista</span>
                              {firstTurma?.discount_cash > 0 && (
                                <span className="text-xs text-green-600 ml-auto whitespace-nowrap">-R$ {Number(firstTurma.discount_cash || 0).toFixed(2)}</span>
                              )}
                            </TabsTrigger>
                          )}
                          {firstTurma?.allow_installments && (
                            <TabsTrigger value="CREDIT_CARD_INSTALL" className="gap-2 flex items-center w-full justify-start h-auto py-3 px-4">
                              <CreditCard className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">Cartão parcelado</span>
                            </TabsTrigger>
                          )}
                        </TabsList>
                      )}

                      {/* Bottom row: Débito | PIX | Boleto (conforme permitido) */}
                      {(firstTurma?.allow_debit_card || firstTurma?.allow_pix || firstTurma?.allow_boleto) && (
                        <TabsList className={`flex flex-col gap-2 h-auto ${
                          [firstTurma?.allow_debit_card, firstTurma?.allow_pix, firstTurma?.allow_boleto].filter(Boolean).length === 3 
                            ? 'sm:grid sm:grid-cols-3' 
                            : 'sm:grid sm:grid-cols-2'
                        }`}>
                          {firstTurma?.allow_debit_card && (
                            <TabsTrigger value="DEBIT_CARD" className="gap-2 flex items-center w-full justify-start h-auto py-3 px-4">
                              <CreditCard className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">Débito</span>
                              {firstTurma?.discount_debit > 0 && (
                                <span className="text-xs text-green-600 ml-auto whitespace-nowrap">-R$ {Number(firstTurma.discount_debit || 0).toFixed(2)}</span>
                              )}
                            </TabsTrigger>
                          )}
                          {firstTurma?.allow_pix && (
                            <TabsTrigger value="PIX" className="gap-2 flex items-center w-full justify-start h-auto py-3 px-4">
                              <QrCode className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">PIX</span>
                              {firstTurma?.discount_pix > 0 && (
                                <span className="text-xs text-green-600 ml-auto whitespace-nowrap">-R$ {Number(firstTurma.discount_pix || 0).toFixed(2)}</span>
                              )}
                            </TabsTrigger>
                          )}
                          {firstTurma?.allow_boleto && (
                            <TabsTrigger value="BOLETO" className="gap-2 flex items-center w-full justify-start h-auto py-3 px-4">
                              <Barcode className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">Boleto</span>
                            </TabsTrigger>
                          )}
                        </TabsList>
                      )}
                    </div>

                    <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-200">
                      <strong>Você escolheu a forma de pagamento:</strong>
                      <span className="ml-2 font-medium">{getPaymentMethodLabel(paymentMethod)}</span>
                    </div>

                    {/* Cartão à vista */}
                    <TabsContent value="CREDIT_CARD_ONE" className="space-y-4 mt-4">
                      {firstTurma?.discount_cash > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-700 dark:text-green-400">
                          💳 R$ {Number(firstTurma.discount_cash || 0).toFixed(2)} de desconto no pagamento à vista!
                        </div>
                      )}
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
                            maxLength={5}
                            value={formData.expiry}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              setFormData({ ...formData, expiry: value });
                            }}
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
                            maxLength={5}
                            value={formData.expiry}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              setFormData({ ...formData, expiry: value });
                            }}
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
<Label htmlFor="installments">Parcelas:</Label>
<div className="relative inline-block ml-2">
  <select
    id="installments"
    value={installmentCount}
    onChange={(e) => setInstallmentCount(Number(e.target.value))}
    className="flex h-10 rounded-md border border-input bg-background px-2 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm w-40 appearance-none"
  >
                            {Array.from({ length: firstTurma?.max_installments || 12 }).map((_, i) => {
                              const val = i + 1;
                              if (val < 2) return null;
                              return (
                                <option key={val} value={val}>{val}x de R$ {(subtotal / val).toFixed(2)}</option>
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
                      {firstTurma?.discount_debit > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-700 dark:text-green-400">
                          💳 R$ {Number(firstTurma.discount_debit || 0).toFixed(2)} de desconto no pagamento por débito!
                        </div>
                      )}

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
                            maxLength={5}
                            value={formData.expiry}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              setFormData({ ...formData, expiry: value });
                            }}
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
                          {/* Contador de tempo */}
                          <div className={`p-4 rounded-xl text-center ${
                            pixTimeRemaining === 'Expirado' 
                              ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' 
                              : 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                          }`}>
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Clock className={`w-5 h-5 ${pixTimeRemaining === 'Expirado' ? 'text-red-600' : 'text-blue-600'}`} />
                              <span className="font-semibold text-lg">
                                {pixTimeRemaining === 'Expirado' ? 'PIX Expirado' : `Tempo restante: ${pixTimeRemaining}`}
                              </span>
                            </div>
                            {pixTimeRemaining === 'Expirado' ? (
                              <p className="text-sm text-red-600 dark:text-red-400">
                                Gere um novo PIX para continuar com a compra
                              </p>
                            ) : (
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                Complete o pagamento dentro do prazo para garantir sua matrícula
                              </p>
                            )}
                          </div>

                          {/* QR Code */}
                          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl flex justify-center border-2 border-border">
                            <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-64 h-64" />
                          </div>

                          {/* Código copia e cola */}
                          <div className="space-y-2">
                            <Label className="text-base font-semibold">Código PIX Copia e Cola</Label>
                            <div className="flex gap-2">
                              <Input
                                value={pixCopyPaste}
                                readOnly
                                className="font-mono text-xs h-12"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pixCopyPaste);
                                  toast({ title: '✅ Código copiado!', description: 'Cole no app do seu banco' });
                                }}
                                className="h-12 px-6"
                              >
                                Copiar
                              </Button>
                            </div>
                          </div>

                          {/* Instruções */}
                          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <p className="font-semibold text-sm">📱 Como pagar:</p>
                            <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                              <li>Abra o app do seu banco</li>
                              <li>Escolha pagar com PIX</li>
                              <li>Escaneie o QR Code ou cole o código</li>
                              <li>Confirme o pagamento</li>
                            </ol>
                          </div>

                          {/* Botão para trocar método */}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setPixQrCode('');
                              setPixCopyPaste('');
                              setPixExpiresAt(null);
                              setPixTimeRemaining('');
                            }}
                          >
                            Escolher outro método de pagamento
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="mb-2 font-medium">Pagamento instantâneo via PIX</p>
                          <p className="text-sm">Clique em "Gerar PIX" para criar o QR Code</p>
                          {firstTurma?.discount_pix > 0 && (
                            <div className="mt-4 inline-block bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                🎉 R$ {Number(firstTurma.discount_pix || 0).toFixed(2)} de desconto no PIX
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Boleto */}
                    <TabsContent value="BOLETO" className="mt-4">
                      {boletoUrl ? (
                        <div className="space-y-4">
                          {/* Aviso de vencimento */}
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center border-2 border-amber-200 dark:border-amber-800">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-amber-600" />
                              <span className="font-semibold text-lg text-amber-700 dark:text-amber-400">
                                Vencimento definido pelo provedor de pagamento
                              </span>
                            </div>
                            <p className="text-sm text-amber-600 dark:text-amber-500">
                              Pague até o vencimento para garantir sua matrícula!
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-500">Após gerar o boleto, o banco pode levar até 48 horas úteis para confirmar o pagamento. Assim que a compensação for realizada, seu acesso será liberado automaticamente.</p>
                          </div>

                          {/* Código de barras */}
                          <div className="space-y-2">
                            <Label className="text-base font-semibold">Código de Barras</Label>
                            <div className="flex gap-2">
                              <Input
                                value={boletoBarcode}
                                readOnly
                                className="font-mono text-sm h-12"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(boletoBarcode);
                                  toast({ title: '✅ Código copiado!', description: 'Cole no app do seu banco' });
                                }}
                                className="h-12 px-6"
                              >
                                Copiar
                              </Button>
                            </div>
                          </div>

                          {/* Botão visualizar boleto */}
                          <Button
                            type="button"
                            onClick={() => window.open(boletoUrl, '_blank')}
                            className="w-full h-12 gradient-bg"
                          >
                            <Barcode className="w-5 h-5 mr-2" />
                            Visualizar e Imprimir Boleto
                          </Button>

                          {/* Instruções */}
                          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <p className="font-semibold text-sm">🏦 Como pagar:</p>
                            <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                              <li>Copie o código de barras acima</li>
                              <li>Acesse o app do seu banco ou vá até uma lotérica</li>
                              <li>Escolha "Pagar boleto"</li>
                              <li>Cole o código ou escaneie o código de barras</li>
                              <li>Confirme o pagamento</li>
                            </ol>
                          </div>

                          {/* Botão para trocar método */}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setBoletoUrl('');
                              setBoletoBarcode('');
                            }}
                          >
                            Escolher outro método de pagamento
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Barcode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="mb-2 font-medium">Boleto bancário — vencimento definido pelo provedor de pagamento</p>
                          <p className="text-sm">Clique em "Gerar Boleto" para criar a cobrança</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Mostrar botão diferente quando PIX/Boleto já foram gerados */}
                {(paymentMethod === 'PIX' && pixQrCode) || (paymentMethod === 'BOLETO' && boletoUrl) ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border-2 border-green-200 dark:border-green-800">
                      <Check className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        {paymentMethod === 'PIX' ? 'PIX Gerado com Sucesso!' : 'Boleto Gerado com Sucesso!'}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                        {paymentMethod === 'PIX' 
                          ? 'Efetue o pagamento para liberar seu acesso' 
                          : 'Pague o boleto para liberar seu acesso'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || (subtotal > 0 && !asaasService.isConfigured())}
                    className="w-full h-14 gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold text-lg rounded-xl"
                  >
                    {loading ? (
                        'Processando...'
                      ) : paymentMethod === 'CREDIT_CARD_ONE' ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          {subtotal <= 0 ? 'Finalizar Matrícula' : `Finalizar Compra: R$ ${subtotal.toFixed(2)}`}
                        </>
                      ) : paymentMethod === 'CREDIT_CARD_INSTALL' ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          {subtotal <= 0 ? 'Finalizar Matrícula' : `Parcelado: ${installmentCount}x de R$ ${(installmentCount > 0 ? (subtotal / installmentCount).toFixed(2) : subtotal.toFixed(2))}`}
                        </>
                      ) : paymentMethod === 'PIX' ? (
                        <>
                          <QrCode className="w-5 h-5 mr-2" />
                          {subtotal <= 0 ? 'Finalizar Matrícula' : `Gerar PIX - R$ ${subtotal.toFixed(2)}`}
                        </>
                      ) : paymentMethod === 'DEBIT_CARD' ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          {subtotal <= 0 ? 'Finalizar Matrícula' : `Débito - R$ ${subtotal.toFixed(2)}`}
                        </>
                      ) : (
                        <>
                          <Barcode className="w-5 h-5 mr-2" />
                          {subtotal <= 0 ? 'Finalizar Matrícula' : `Gerar Boleto - R$ ${subtotal.toFixed(2)}`}
                        </>
                      )}
                  </Button>
                )}

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
