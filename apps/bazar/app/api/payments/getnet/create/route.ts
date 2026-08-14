import { NextResponse } from "next/server";
import { createGetnetRequest } from "../../../../lib/getnet";

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "127.0.0.1";
}

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
    const transaction = await createGetnetRequest({
      reference: orderId,
      description: `Compra Bazar ${orderId}`,
      amount,
      returnUrl: `${origin}/api/payments/getnet/return?orderId=${encodeURIComponent(orderId)}`,
      notificationUrl: `${origin}/api/payments/getnet/notification`,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "Bazar Web",
    });

    if (!transaction.requestId || !transaction.processUrl) {
      return NextResponse.json(
        { error: transaction.status.message ?? "Getnet no entrego URL de pago." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      requestId: transaction.requestId,
      processUrl: transaction.processUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar Getnet." },
      { status: 500 },
    );
  }
}
