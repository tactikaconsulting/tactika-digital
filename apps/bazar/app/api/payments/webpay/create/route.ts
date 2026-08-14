import { NextResponse } from "next/server";
import { createWebpayTransaction } from "../../../../lib/webpay";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      orderId?: string;
      amount?: number;
    };
    const orderId = body.orderId?.trim();
    const amount = Math.round(Number(body.amount));

    if (!orderId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Pedido o monto invalido." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const transaction = await createWebpayTransaction({
      buyOrder: orderId.replaceAll("-", "").slice(0, 26),
      sessionId: `BZ-${Date.now()}`.slice(0, 61),
      amount,
      returnUrl: `${origin}/api/payments/webpay/return`,
    });

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar Webpay." },
      { status: 500 },
    );
  }
}
