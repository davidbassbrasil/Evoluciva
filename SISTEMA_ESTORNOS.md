# Sistema de Estornos - Guia de Uso

## 📋 Visão Geral

O sistema de estornos permite registrar e gerenciar devoluções de pagamentos, tanto totais quanto parciais. Foi implementado com:

- ✅ Tabela separada `refunds` para histórico completo
- ✅ Múltiplos estornos parciais no mesmo pagamento
- ✅ Controle de status e aprovação
- ✅ Auditoria completa (quem aprovou, quando, etc.)
- ✅ Validação automática de valores

## 🗄️ Estrutura do Banco de Dados

### Tabela `refunds`

```sql
- id: UUID (chave primária)
- payment_id: UUID (FK para payments)
- refund_value: NUMERIC(10,2) (valor do estorno)
- reason: TEXT (motivo obrigatório)
- description: TEXT (descrição detalhada opcional)
- status: TEXT (PENDING, APPROVED, PROCESSING, COMPLETED, FAILED, CANCELLED)
- asaas_refund_id: TEXT (ID do estorno na Asaas)
- refund_date: TIMESTAMP (data de conclusão)
- approved_by: UUID (admin que aprovou)
- approved_at: TIMESTAMP
- metadata: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🚀 Como Configurar

### 1. Executar Script SQL

Execute o arquivo `setup-estornos.sql` no SQL Editor do Supabase:

```bash
# Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql/new
# Cole o conteúdo de: supabase/setup-estornos.sql
# Clique em "Run"
```

### 2. Verificar Políticas RLS

As políticas já estão configuradas automaticamente:
- ✅ Admins podem criar, ver e editar todos estornos
- ✅ Usuários podem ver estornos dos próprios pagamentos
- ✅ Service role tem acesso total (para webhooks)

## 💻 Como Usar na Interface Admin

### Solicitar Estorno

1. Acesse `/admin/financeiro`
2. Encontre o pagamento confirmado
3. Clique no botão **"Estornar"** na coluna Ações
4. Preencha o formulário:
   - **Valor do Estorno**: Até o valor total do pagamento
   - **Motivo**: Campo obrigatório (ex: "Solicitação do cliente")
   - **Descrição**: Opcional, para informações adicionais
5. Clique em **"Solicitar Estorno"**

### Estados do Estorno

- **PENDING**: Aguardando processamento
- **APPROVED**: Aprovado para processamento
- **PROCESSING**: Sendo processado
- **COMPLETED**: Estorno concluído com sucesso
- **FAILED**: Falha no processamento
- **CANCELLED**: Estorno cancelado

## 🔍 Filtros Disponíveis

### Filtro por Período
- Hoje, 7 dias, 30 dias, 90 dias
- Este Mês, Este Ano
- Seleção customizada (calendário)

### Filtro por Turma
- Selecione uma turma específica
- Veja quanto aquela turma gerou em receita
- Filtra automaticamente todos os stats

### Outros Filtros
- Status do pagamento
- Tipo de pagamento (Cartão, PIX, Boleto)
- Busca por nome, email, ID

## 🛠️ Functions Auxiliares

### Consultar valor já estornado de um pagamento

```sql
SELECT get_payment_refunded_amount('payment-uuid-aqui');
```

### Verificar se pode estornar um valor

```sql
SELECT can_refund_payment('payment-uuid-aqui', 100.00);
-- Retorna TRUE se pode estornar R$ 100,00
```

### Buscar todos estornos de um pagamento

```sql
SELECT * FROM refunds 
WHERE payment_id = 'payment-uuid-aqui'
ORDER BY created_at DESC;
```

## 📊 Exemplos de Uso

### Estorno Total

```sql
INSERT INTO refunds (payment_id, refund_value, reason, description)
VALUES (
  'payment-uuid',
  150.00,
  'Arrependimento do cliente',
  'Cliente solicitou cancelamento dentro do prazo de 7 dias'
);
```

### Estorno Parcial

```sql
-- Pagamento de R$ 300,00
-- Estornar R$ 100,00

INSERT INTO refunds (payment_id, refund_value, reason)
VALUES (
  'payment-uuid',
  100.00,
  'Desconto por problema no curso'
);

-- Pode fazer outro estorno parcial depois (até R$ 200,00 restantes)
```

## 🔐 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Apenas admins podem criar/editar estornos
- ✅ Validação de valores (não pode exceder valor do pagamento)
- ✅ Auditoria completa (quem fez, quando)
- ✅ Histórico imutável (não deleta, apenas atualiza status)

## 🔄 Integração com Asaas (Próximos Passos)

Para integrar estornos com a Asaas, adicione no webhook handler:

```typescript
// Processar estorno aprovado
if (refund.status === 'APPROVED') {
  const response = await fetch('https://asaas.com/api/v3/payments/{id}/refund', {
    method: 'POST',
    headers: {
      'access_token': ASAAS_API_KEY
    },
    body: JSON.stringify({
      value: refund.refund_value,
      description: refund.reason
    })
  });
  
  // Atualizar refund com asaas_refund_id
  await supabase
    .from('refunds')
    .update({ 
      asaas_refund_id: response.id,
      status: 'PROCESSING' 
    })
    .eq('id', refund.id);
}
```

## 📱 Interface do Usuário

Os usuários podem ver seus próprios estornos (já configurado via RLS), mas ainda não há interface frontend para isso. Para adicionar:

1. Criar página `/aluno/meus-pagamentos`
2. Listar pagamentos com estornos relacionados
3. Mostrar status do estorno
4. Permitir solicitação de estorno (se dentro do prazo)

## ⚠️ Observações Importantes

1. **Estornos múltiplos**: O sistema permite múltiplos estornos parciais no mesmo pagamento
2. **Validação automática**: A soma dos estornos não pode exceder o valor do pagamento
3. **Status do pagamento**: Considere atualizar o status do pagamento para 'REFUNDED' quando estorno for total
4. **Prazo de estorno**: Implemente regras de negócio para prazos (ex: 7 dias após pagamento)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console do navegador
2. Consulte as políticas RLS no Supabase
3. Teste as functions auxiliares via SQL Editor
