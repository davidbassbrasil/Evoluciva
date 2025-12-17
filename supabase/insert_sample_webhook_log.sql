-- Insert sample webhook log for debugging
-- Run this in Supabase SQL editor as a service-role user if RLS blocks client inserts.

INSERT INTO webhook_logs (
  event_type,
  asaas_payment_id,
  payload,
  processed,
  retry_count,
  headers,
  source_ip,
  user_agent,
  created_at,
  updated_at
)
VALUES (
  'PAYMENT_CONFIRMED',
  'pay_sjndlkitjmd15nlc',
  $json$
  {
    "id": "evt_15e444ff9b9ab9ec29294aa1abe68025&13227314",
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_sjndlkitjmd15nlc",
      "value": 100,
      "escrow": null,
      "object": "payment",
      "status": "CONFIRMED",
      "deleted": false,
      "dueDate": "2025-12-23",
      "refunds": null,
      "customer": "cus_000007280404",
      "netValue": 97.52,
      "creditCard": {
        "creditCardBrand": "MASTERCARD",
        "creditCardToken": "063bded6-4091-4903-9243-1f0b73495592",
        "creditCardNumber": "8829"
      },
      "creditDate": "2026-01-19",
      "invoiceUrl": "https://sandbox.asaas.com/i/sjndlkitjmd15nlc",
      "anticipable": false,
      "anticipated": false,
      "bankSlipUrl": null,
      "billingType": "CREDIT_CARD",
      "dateCreated": "2025-12-16",
      "description": "Concurso Educação AL 2026 - Concurso Educação AL 2026 (Presencial)",
      "nossoNumero": null,
      "paymentDate": null,
      "paymentLink": null,
      "confirmedDate": "2025-12-16",
      "interestValue": null,
      "invoiceNumber": "12316743",
      "originalValue": null,
      "postalService": false,
      "pixTransaction": null,
      "checkoutSession": null,
      "originalDueDate": "2025-12-23",
      "clientPaymentDate": "2025-12-16",
      "externalReference": "324c103f-3d0c-4c39-97ec-3aa934ab1eab-cart",
      "installmentNumber": null,
      "estimatedCreditDate": "2026-01-19",
      "lastInvoiceViewedDate": null,
      "transactionReceiptUrl": "https://sandbox.asaas.com/comprovantes/0002943904873264",
      "lastBankSlipViewedDate": null
    },
    "dateCreated": "2025-12-16 19:38:33"
  }
  $json$::jsonb,
  true,
  0,
  $json$
  {
    "host": "edge-runtime.supabase.com",
    "accept": "application/json",
    "cf-ray": "9af1abf6248df203-GRU",
    "pragma": "no-cache",
    "baggage": "sb-request-id=019b2950-b5d0-78a3-be29-0c1481bf55ad",
    "cdn-loop": "cloudflare; loops=1; subreqs=1",
    "cf-ew-via": "15",
    "cf-worker": "supabase.co",
    "cf-visitor": "{\"scheme\":\"https\"}",
    "tracestate": "dd=s:0;p:724a19ce3993450c;t.tid:6941df6900000000",
    "user-agent": "Asaas_Hmlg/3.0",
    "traceparent": "00-6941df6900000000792814a3a30cab3c-724a19ce3993450c-00",
    "content-type": "application/json",
    "cache-control": "no-cache",
    "sb-request-id": "019b2950-b5d0-78a3-be29-0c1481bf55ad",
    "content-length": "1308",
    "x-datadog-tags": "_dd.p.tid=6941df6900000000",
    "accept-encoding": "gzip",
    "x-amzn-trace-id": "Root=1-6941df69-5cac410233cd601871f9ae1e",
    "x-forwarded-for": "54.232.48.115,54.232.48.115, 99.82.164.21",
    "cf-connecting-ip": "54.232.48.115",
    "x-forwarded-port": "443",
    "x-forwarded-proto": "https",
    "x-datadog-trace-id": "8730250570705447740",
    "x-datadog-parent-id": "8235423242120283404",
    "x-datadog-sampling-priority": "0"
  }
  $json$::jsonb,
  '54.232.48.115',
  'Asaas_Hmlg/3.0',
  '2025-12-16 22:38:35.540862+00',
  '2025-12-16 22:38:35.697924+00'
);

-- NOTE:
-- If your DB enforces RLS for inserts, run this query using a service-role user
-- (e.g. Supabase SQL editor or an Edge Function with SUPABASE_SERVICE_ROLE_KEY).
