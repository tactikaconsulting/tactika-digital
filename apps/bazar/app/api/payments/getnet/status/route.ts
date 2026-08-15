import { NextResponse } from "next/server";
import { getGetnetRequestInformation } from "../../../../lib/getnet";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      requestId?: string | number;
      orderId?: string;
    };
    const requestId = body.requestId ? String(body.requestId).trim() : "";

    if (!requestId) {
      return NextResponse.json({ error: "Falta requestId de Getnet." }, { status: 400 });
    }

    const result = await getGetnetRequestInformation(requestId);
    const payment = result.payment?.[0];
    const status = payment?.status.status ?? result.status.status;
    const approved = status.toUpperCase() === "APPROVED";

    return NextResponse.json({
      requestId: result.requestId,
      orderId: body.orderId ?? payment?.reference ?? "",
      reference: payment?.receipt ?? String(result.requestId),
      status: approved ? "approved" : status.toLowerCase(),
      message: approved ? "Pago Getnet aprobado." : `Pago Getnet ${status.toLowerCase()}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo consultar Getnet." },
      { status: 500 },
    );
  }
}
