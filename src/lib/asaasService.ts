/**
 * Asaas Payment Gateway Integration via Supabase Edge Function
 * API Documentation: https://docs.asaas.com/reference/comece-por-aqui
 * 
 * IMPORTANTE: Usa Edge Function do Supabase com autenticação JWT
 */

import { supabase } from './supabaseClient';

// URL da Edge Function (asaas-proxy)
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-proxy`;

interface AsaasCustomer {
  id?: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}

interface AsaasDiscount {
  value?: number;
  dueDateLimitDays?: number;
  type?: 'FIXED' | 'PERCENTAGE';
}

interface AsaasInterest {
  value: number;
}

interface AsaasFine {
  value: number;
}

interface AsaasCallback {
  successUrl?: string;
  autoRedirect?: boolean;
}

interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: AsaasDiscount;
  interest?: AsaasInterest;
  fine?: AsaasFine;
  postalService?: boolean;
  callback?: AsaasCallback;
}

interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface AsaasCreditCardPayment {
  customer: string;
  billingType: 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard: AsaasCreditCard;
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
  remoteIp?: string;
}

interface AsaasDebitCardPayment {
  customer: string;
  billingType: 'DEBIT_CARD';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  creditCard: AsaasCreditCard;
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
}

class AsaasService {
  /**
   * Método privado para chamar a Edge Function com autenticação
   */
  private async callEdgeFunction<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    try {
      // Obter token de autenticação do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar Edge Function com autenticação JWT
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          method,
          endpoint,
          body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Edge Function Error:', data);
        console.error('Error details:', JSON.stringify(data, null, 2));
        if (data.errors && Array.isArray(data.errors)) {
          console.error('Asaas Errors:', data.errors);
          // Extrair primeira mensagem de erro do Asaas
          const firstError = data.errors[0];
          if (firstError && firstError.description) {
            throw new Error(firstError.description);
          }
        }
        throw new Error(data.message || data.error || 'Erro na API Asaas');
      }

      return data;
    } catch (error) {
      console.error('Edge Function request error:', error);
      throw error;
    }
  }

  /**
   * Criar ou buscar cliente na Asaas
   * Docs: https://docs.asaas.com/reference/criar-novo-cliente
   */
  async createCustomer(customerData: AsaasCustomer): Promise<any> {
    // Primeiro tenta buscar cliente existente por CPF/CNPJ
    try {
      const existingCustomer = await this.getCustomerByCpfCnpj(customerData.cpfCnpj);
      if (existingCustomer) {
        return existingCustomer;
      }
    } catch (error) {
      // Cliente não existe, continua para criar
    }

    return this.callEdgeFunction<any>('POST', '/customers', customerData);
  }

  /**
   * Buscar cliente por CPF/CNPJ
   */
  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<any> {
    const response = await this.callEdgeFunction<any>(
      'GET',
      `/customers?cpfCnpj=${cpfCnpj}`
    );
    return response.data?.[0] || null;
  }

  /**
   * Criar cobrança (PIX, Boleto, etc)
   * Docs: https://docs.asaas.com/reference/criar-nova-cobranca
   */
  async createPayment(paymentData: AsaasPayment): Promise<any> {
    return this.callEdgeFunction<any>('POST', '/payments', paymentData);
  }

  /**
   * Criar cobrança com cartão de crédito
   * Docs: https://docs.asaas.com/reference/criar-cobranca-com-cartao-de-credito
   */
  async createCreditCardPayment(paymentData: AsaasCreditCardPayment): Promise<any> {
    return this.callEdgeFunction<any>('POST', '/payments', paymentData);
  }

  /**
   * Criar cobrança com cartão de débito
   * Alguns gateways tratam débito de forma distinta; Asaas aceita `DEBIT_CARD` nos pagamentos.
   */
  async createDebitCardPayment(paymentData: AsaasDebitCardPayment): Promise<any> {
    return this.callEdgeFunction<any>('POST', '/payments', paymentData);
  }

  /**
   * Obter QR Code PIX de uma cobrança
   * Docs: https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix
   */
  async getPixQrCode(paymentId: string): Promise<any> {
    return this.callEdgeFunction<any>('GET', `/payments/${paymentId}/pixQrCode`);
  }

  /**
   * Obter linha digitável do boleto
   * Docs: https://docs.asaas.com/reference/obter-linha-digitavel-do-boleto
   */
  async getBoletoIdentificationField(paymentId: string): Promise<any> {
    return this.callEdgeFunction<any>('GET', `/payments/${paymentId}/identificationField`);
  }

  /**
   * Consultar status de pagamento
   * Docs: https://docs.asaas.com/reference/recuperar-uma-unica-cobranca
   */
  async getPayment(paymentId: string): Promise<any> {
    return this.callEdgeFunction<any>('GET', `/payments/${paymentId}`);
  }

  /**
   * Verificar se a API está configurada
   */
  isConfigured(): boolean {
    return !!EDGE_FUNCTION_URL;
  }

  /**
   * Verificar ambiente (sandbox ou produção) - definido nas secrets da Edge Function
   */
  isSandbox(): boolean {
    // Retorna true por padrão (sandbox). Em produção, a Edge Function usa ASAAS_ENV=production
    return true;
  }
}

export const asaasService = new AsaasService();
export type { AsaasCustomer, AsaasPayment, AsaasCreditCard, AsaasCreditCardPayment };
