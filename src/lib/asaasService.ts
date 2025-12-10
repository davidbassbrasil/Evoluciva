/**
 * Asaas Payment Gateway Integration
 * API Documentation: https://docs.asaas.com/reference/comece-por-aqui
 */

const ASAAS_API_URL = import.meta.env.VITE_ASAAS_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://api-sandbox.asaas.com/v3';

const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY || '';

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
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = ASAAS_API_KEY;
    this.apiUrl = ASAAS_API_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Asaas API Error:', data);
        throw new Error(data.errors?.[0]?.description || 'Erro na API Asaas');
      }

      return data;
    } catch (error) {
      console.error('Request error:', error);
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

    return this.request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  /**
   * Buscar cliente por CPF/CNPJ
   */
  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<any> {
    const response = await this.request<any>(
      `/customers?cpfCnpj=${cpfCnpj}`
    );
    return response.data?.[0] || null;
  }

  /**
   * Criar cobrança (PIX, Boleto, etc)
   * Docs: https://docs.asaas.com/reference/criar-nova-cobranca
   */
  async createPayment(paymentData: AsaasPayment): Promise<any> {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Criar cobrança com cartão de crédito
   * Docs: https://docs.asaas.com/reference/criar-cobranca-com-cartao-de-credito
   */
  async createCreditCardPayment(paymentData: AsaasCreditCardPayment): Promise<any> {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Criar cobrança com cartão de débito
   * Alguns gateways tratam débito de forma distinta; Asaas aceita `DEBIT_CARD` nos pagamentos.
   */
  async createDebitCardPayment(paymentData: AsaasDebitCardPayment): Promise<any> {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Obter QR Code PIX de uma cobrança
   * Docs: https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix
   */
  async getPixQrCode(paymentId: string): Promise<any> {
    return this.request<any>(`/payments/${paymentId}/pixQrCode`);
  }

  /**
   * Obter linha digitável do boleto
   * Docs: https://docs.asaas.com/reference/obter-linha-digitavel-do-boleto
   */
  async getBoletoIdentificationField(paymentId: string): Promise<any> {
    return this.request<any>(`/payments/${paymentId}/identificationField`);
  }

  /**
   * Consultar status de pagamento
   * Docs: https://docs.asaas.com/reference/recuperar-uma-unica-cobranca
   */
  async getPayment(paymentId: string): Promise<any> {
    return this.request<any>(`/payments/${paymentId}`);
  }

  /**
   * Verificar se a API Key está configurada
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Verificar ambiente (sandbox ou produção)
   */
  isSandbox(): boolean {
    return this.apiUrl.includes('sandbox');
  }
}

export const asaasService = new AsaasService();
export type { AsaasCustomer, AsaasPayment, AsaasCreditCard, AsaasCreditCardPayment };
