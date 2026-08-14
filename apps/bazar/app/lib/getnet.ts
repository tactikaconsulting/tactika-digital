import crypto from "node:crypto";

const GETNET_TEST_URL = "https://checkout.test.getnet.cl";
const GETNET_PRODUCTION_URL = "https://checkout.getnet.cl";

type GetnetStatus = {
  status: string;
  reason?: string;
  message?: string;
  date?: string;
};

export type GetnetCreateResponse = {
  status: GetnetStatus;
  requestId?: number;
  processUrl?: string;
};

export type GetnetRequestInfo = {
  requestId: number;
  status: GetnetStatus;
  payment?: Array<{
    status: GetnetStatus;
    reference?: string;
    amount?: {
      currency?: string;
      total?: number;
    };
    receipt?: string;
  }>;
};

function getGetnetConfig() {
  const login = process.env.GETNET_LOGIN;
  const tranKey = process.env.GETNET_TRANKEY;
  const environment = process.env.GETNET_ENVIRONMENT === "production" ? "production" : "integration";

  return {
    ready: Boolean(login && tranKey),
    login,
    tranKey,
    baseUrl: process.env.GETNET_BASE_URL ?? (environment === "production" ? GETNET_PRODUCTION_URL : GETNET_TEST_URL),
  };
}

function getAuth() {
  const config = getGetnetConfig();

  if (!config.ready || !config.login || !config.tranKey) {
    throw new Error("Faltan GETNET_LOGIN y GETNET_TRANKEY en Vercel.");
  }

  const seed = new Date().toISOString();
  const rawNonce = crypto.randomBytes(16);
  const nonce = rawNonce.toString("base64");
  const tranKey = crypto
    .createHash("sha256")
    .update(Buffer.concat([rawNonce, Buffer.from(seed), Buffer.from(config.tranKey)]))
    .digest("base64");

  return {
    baseUrl: config.baseUrl,
    auth: {
      login: config.login,
      tranKey,
      nonce,
      seed,
    },
  };
}

export async function createGetnetRequest({
  reference,
  description,
  amount,
  returnUrl,
  notificationUrl,
  ipAddress,
  userAgent,
}: {
  reference: string;
  description: string;
  amount: number;
  returnUrl: string;
  notificationUrl: string;
  ipAddress: string;
  userAgent: string;
}) {
  const { baseUrl, auth } = getAuth();
  const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const response = await fetch(`${baseUrl}/api/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth,
      locale: "es_CL",
      payment: {
        reference,
        description,
        amount: {
          currency: "CLP",
          total: amount,
        },
      },
      expiration,
      returnUrl,
      notificationUrl,
      ipAddress,
      userAgent,
    }),
  });

  if (!response.ok) {
    throw new Error(`Getnet rechazo la creacion del pago (${response.status}).`);
  }

  return response.json() as Promise<GetnetCreateResponse>;
}

export async function getGetnetRequestInformation(requestId: string) {
  const { baseUrl, auth } = getAuth();
  const response = await fetch(`${baseUrl}/api/session/${requestId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth }),
  });

  if (!response.ok) {
    throw new Error(`Getnet rechazo la consulta del pago (${response.status}).`);
  }

  return response.json() as Promise<GetnetRequestInfo>;
}
