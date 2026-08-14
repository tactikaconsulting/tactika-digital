import { NextResponse } from "next/server";
import { commitWebpayTransaction } from "../../../../lib/webpay";

function redirectToApp(request: Request, params: Record<string, string>) {
  const url = new URL("/", request.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url);
}

async function handleWebpayReturn(request: Request, token: string | null) {
  if (!token) {
    return redirectToApp(request, {
      webpay_status: "cancelled",
      webpay_message: "Pago cancelado o token no recibido.",
    });
  }

  try {
    const result = await commitWebpayTransaction(token);
    const approved = result.status === "AUTHORIZED" && result.response_code === 0;

    return redirectToApp(request, {
      webpay_status: approved ? "approved" : "rejected",
      webpay_order: result.buy_order,
      webpay_amount: String(result.amount),
      webpay_message: approved ? "Pago Webpay autorizado." : "Pago Webpay rechazado.",
    });
  } catch (error) {
    return redirectToApp(request, {
      webpay_status: "error",
      webpay_message: error instanceof Error ? error.message : "No se pudo confirmar Webpay.",
    });
  }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token_ws");
  return handleWebpayReturn(request, token);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = form.get("token_ws");

  return handleWebpayReturn(request, typeof token === "string" ? token : null);
}
