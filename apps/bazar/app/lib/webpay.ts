const WEBPAY_INTEGRATION_URL = "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions";
const WEBPAY_PRODUCTION_URL = "https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions";

export type WebpayCreateResponse = {
  token: string;
  url: string;
};

export type WebpayCommitResponse = {
  buy_order: string;
  session_id: string;
  amount: number;
  status: string;
  response_code: number;
  authorization_code?: string;
  payment_type_code?: string;
  transaction_date?: string;
};

export function getWebpayConfig() {
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
  const apiKey = process.env.WEBPAY_API_KEY;
  const environment = process.env.WEBPAY_ENVIRONMENT === "production" ? "production" : "integration";

  return {
    ready: Boolean(commerceCode && apiKey),
    commerceCode,
    apiKey,
    environment,
    baseUrl: environment === "production" ? WEBPAY_PRODUCTION_URL : WEBPAY_INTEGRATION_URL,
  };
}

export async function createWebpayTransaction({
  buyOrder,
  sessionId,
  amount,
  returnUrl,
}: {
  buyOrder: string;
  sessionId: string;
  amount: number;
  returnUrl: string;
}) {
  const config = getWebpayConfig();

  if (!config.ready || !config.commerceCode || !config.apiKey) {
    throw new Error("Faltan WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY en Vercel.");
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Tbk-Api-Key-Id": config.commerceCode,
      "Tbk-Api-Key-Secret": config.apiKey,
    },
    body: JSON.stringify({
      buy_order: buyOrder.slice(0, 26),
      session_id: sessionId.slice(0, 61),
      amount,
      return_url: returnUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Webpay rechazo la creacion de la transaccion (${response.status}).`);
  }

  return response.json() as Promise<WebpayCreateResponse>;
}

export async function commitWebpayTransaction(token: string) {
  const config = getWebpayConfig();

  if (!config.ready || !config.commerceCode || !config.apiKey) {
    throw new Error("Faltan WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY en Vercel.");
  }

  const response = await fetch(`${config.baseUrl}/${token}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Tbk-Api-Key-Id": config.commerceCode,
      "Tbk-Api-Key-Secret": config.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Webpay rechazo la confirmacion de la transaccion (${response.status}).`);
  }

  return response.json() as Promise<WebpayCommitResponse>;
}
