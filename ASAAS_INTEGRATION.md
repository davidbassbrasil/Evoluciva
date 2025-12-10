# Integração Asaas - Guia de Configuração

## 📋 Sobre a Integração

Este projeto está integrado com o **Asaas**, gateway de pagamento brasileiro que permite receber pagamentos via:
- 💳 **Cartão de Crédito** - Aprovação instantânea
- 📱 **PIX** - QR Code e Copia e Cola
- 🧾 **Boleto Bancário** - Geração automática

## 🚀 Primeiros Passos

### 1. Criar Conta no Asaas

**Para Testes (Sandbox):**
1. Acesse: https://sandbox.asaas.com/onboarding/createAccount
2. Preencha seus dados para criar uma conta de testes
3. Após o cadastro, acesse: Configurações → Integrações → API
4. Copie sua **Chave de API Sandbox**

**Para Produção:**
1. Acesse: https://www.asaas.com.br/
2. Crie sua conta real
3. Complete o cadastro e validação
4. Acesse: Configurações → Integrações → API
5. Copie sua **Chave de API Produção**

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (copie do `.env.example`):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jvfjvzotrqhlfwzcnixj.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Asaas Payment Gateway Configuration
VITE_ASAAS_API_KEY=sua_chave_api_aqui
VITE_ASAAS_ENV=sandbox  # Use 'production' para produção
```

**Importante:**
- Para testes, use `VITE_ASAAS_ENV=sandbox`
- Para produção, use `VITE_ASAAS_ENV=production`
- Nunca commite o arquivo `.env` no Git!

### 3. Testar a Integração

Com o ambiente configurado em modo sandbox:

1. Acesse a página de checkout de um curso
2. Preencha os dados do formulário
3. Escolha um método de pagamento:
   - **Cartão**: Use os dados de teste da Asaas
   - **PIX**: Será gerado um QR Code (em sandbox, pode usar o simulador)
   - **Boleto**: Será gerado um boleto de teste

## 🧪 Dados de Teste (Sandbox)

### Cartões de Teste

**Aprovado:**
- Número: `5162306219378829`
- Validade: Qualquer data futura
- CVV: Qualquer 3 dígitos

**Negado:**
- Número: `5162306219378837`

**Outros números:** Confira a documentação oficial

### CPF de Teste
- Use CPFs válidos (ex: `111.111.111-11` funciona em sandbox)

### Telefone de Teste
- Use seu próprio telefone para receber notificações de teste
- Formato: `(51) 99999-9999`

### Email de Teste
- Use seu próprio email para receber notificações

## 📚 Documentação Oficial

- **Asaas Docs:** https://docs.asaas.com/
- **Guia de Cobranças:** https://docs.asaas.com/docs/guia-de-cobrancas
- **Sandbox:** https://docs.asaas.com/docs/sandbox
- **Webhooks:** https://docs.asaas.com/docs/sobre-os-webhooks

## 🔄 Próximos Passos (Para Implementação Futura)

### 1. Configurar Webhooks

Os webhooks notificam automaticamente quando um pagamento é confirmado:

```bash
POST https://seu-dominio.com/api/webhooks/asaas
```

Eventos importantes:
- `PAYMENT_CONFIRMED` - Pagamento confirmado
- `PAYMENT_RECEIVED` - Pagamento recebido
- `PAYMENT_OVERDUE` - Pagamento vencido

### 2. Criar Proxy Backend

Por segurança, recomenda-se criar um backend que faça as chamadas à API Asaas:

```
Frontend → Seu Backend → Asaas API
```

Isso evita expor a API Key no frontend.

### 3. Implementar Validações Adicionais

- Validação de CPF
- Consulta de CEP (ViaCEP)
- Máscara de inputs (cartão, telefone, CPF)
- Limites de valor
- Detecção de fraude

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca exponha sua chave de API no código frontend em produção
- Use sempre um backend/proxy para produção
- Mantenha o `.env` fora do controle de versão
- Em produção, use HTTPS
- Valide todos os dados no backend

## 🆘 Suporte

**Problemas com a integração?**
- Verifique se a API Key está correta
- Confirme que `VITE_ASAAS_ENV` está configurado
- Consulte o console do navegador para erros
- Verifique os logs da API Asaas no painel

**Documentação Asaas:**
- Discord: https://discord.gg/invite/X2kgZm69HV
- Status: https://status.asaas.com/
- Suporte: suporte@asaas.com

## ✅ Checklist de Produção

Antes de ir para produção:

- [ ] Criar conta Asaas real e validar documentos
- [ ] Obter API Key de produção
- [ ] Configurar `VITE_ASAAS_ENV=production`
- [ ] Implementar backend/proxy
- [ ] Configurar webhooks
- [ ] Testar todos os métodos de pagamento
- [ ] Implementar tratamento de erros completo
- [ ] Configurar notificações por email
- [ ] Revisar taxas e prazos de repasse
- [ ] Testar fluxo completo de compra
