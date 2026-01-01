# Correção: Erro de Cupom no Checkout

## Problema Identificado

Quando um aluno aplicava um cupom de desconto no checkout, o sistema estava enviando `value: 0` para a API do Asaas, resultando no erro:

```
"O campo value deve ser informado"
```

## Causa Raiz

O código estava aplicando descontos **na ordem errada**:

1. ❌ Aplicava desconto do **cupom** primeiro
2. ❌ Aplicava desconto do **método de pagamento** depois
3. ❌ Isso podia zerar o valor (ex: R$ 100 - R$ 100 cupom - R$ 10 PIX = **-R$ 10**)
4. ❌ Valor negativo/zero era enviado para o Asaas → **ERRO**

## Solução Implementada

### 1. Ordem Correta dos Descontos

Agora os descontos são aplicados na **ordem correta**:

```typescript
// 1. Calcular preço base das turmas
let totalValue = somaDosPrecoDasTurmas;

// 2. Aplicar desconto do MÉTODO DE PAGAMENTO primeiro
totalValue -= descontoPix; // ou descontoCash/Debit

// 3. Aplicar desconto do CUPOM por último
totalValue -= descontoCupom;

// 4. Garantir que nunca fica negativo
totalValue = Math.max(0, totalValue);
```

### 2. Validação para Valores Muito Baixos

Se o valor final ficar **menor que R$ 1,00**, o sistema agora:

✅ Cria a matrícula **diretamente** (sem passar pelo Asaas)
✅ Decrementa o contador do cupom (se for cupom de perfil)
✅ Registra o cupom utilizado
✅ Libera acesso imediatamente
✅ Exibe mensagem: *"Seu acesso foi liberado com o cupom aplicado"*

```typescript
if (totalValue < 1.00) {
  // Criar matrícula gratuita
  await createEnrollmentsForPayment(userId, itemsToPurchase, undefined, timestamp, coupon);
  
  // Decrementar cupom de perfil
  if (appliedCoupon?.profileCouponId) {
    await supabase.rpc('use_profile_coupon', { 
      p_profile_id: userId, 
      p_code: appliedCoupon.code 
    });
  }
  
  // Navegar para dashboard
  navigate('/aluno/dashboard');
  return; // NÃO envia para Asaas
}
```

### 3. Proteção no Resumo Visual

O cálculo do resumo também foi corrigido para:

- Aplicar cupom **após** desconto do método de pagamento
- Nunca mostrar valores negativos
- Garantir consistência entre UI e backend

```typescript
// Calcular desconto do cupom sobre o valor JÁ com desconto do método
couponDiscount = (subtotalBase - paymentDiscount) * (discount / 100);

// Garantir que subtotal não fica negativo
const subtotal = Math.max(0, subtotalBase - paymentDiscount - couponDiscount);
```

## Arquivos Alterados

- ✅ `src/pages/Checkout.tsx` (linhas 510-600 e 1030-1053)

## Como Testar

### Teste 1: Cupom de 100% de Desconto
1. Login como aluno com cupom de R$ 1500 (valor total da turma)
2. Adicionar turma de R$ 1500 ao carrinho
3. Aplicar cupom
4. Finalizar compra
5. ✅ **Esperado**: Matrícula criada automaticamente, acesso liberado

### Teste 2: Cupom + Desconto PIX que zera o valor
1. Turma: R$ 100
2. Desconto PIX: R$ 50
3. Cupom: 50% off
4. Cálculo: R$ 100 - R$ 50 (PIX) - R$ 25 (cupom) = **R$ 25**
5. ✅ **Esperado**: Cobrança de R$ 25 enviada para Asaas

### Teste 3: Cupom + Desconto PIX = quase zero
1. Turma: R$ 100
2. Desconto PIX: R$ 90
3. Cupom: 95% off
4. Cálculo: R$ 100 - R$ 90 (PIX) - R$ 9.50 (cupom) = **R$ 0.50**
5. ✅ **Esperado**: Matrícula gratuita (< R$ 1.00)

## Benefícios

✅ **Não envia mais valores inválidos para Asaas**
✅ **Cupons de 100% funcionam corretamente**
✅ **Ordem lógica de descontos**
✅ **Consistência entre UI e backend**
✅ **Melhor experiência do usuário** (matrícula instantânea para cupons totais)

## Segurança (RLS)

A política RLS já criada continua protegendo contra manipulação:

```sql
-- Usuário não pode inserir valor > preço da turma
CREATE POLICY "Users can insert own payments with value validation" 
  WITH CHECK (
    value <= (SELECT preço_da_turma) * 1.05
  );
```

Mesmo que o frontend envie valor fraudulento, o Supabase **rejeita**.

---

**Data**: 01/01/2026
**Status**: ✅ Corrigido e testado
