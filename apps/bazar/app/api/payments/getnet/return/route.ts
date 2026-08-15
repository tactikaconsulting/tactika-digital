import { NextResponse } from "next/server";
import { getGetnetRequestInformation } from "../../../../lib/getnet";

function redirectToApp(request: Request, params: Record<string, string>) {
  const url = new URL("/", request.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const orderId = url.searchParams.get("orderId");

  if (!requestId) {
    return redirectToApp(request, {
      getnet_status: "pending",
      getnet_order: orderId ?? "",
      getnet_message: "Retorno recibido. La notificacion de Getnet actualizara el pago.",
    });
  }

  try {
    const result = await getGetnetRequestInformation(requestId);
    const payment = result.payment?.[0];
    const status = payment?.status.status ?? result.status.status;
    const approved = status.toUpperCase() === "APPROVED";

    return redirectToApp(request, {
      getnet_status: approved ? "approved" : status.toLowerCase(),
      getnet_order: orderId ?? payment?.reference ?? "",
      getnet_reference: payment?.receipt ?? String(result.requestId),
      getnet_message: approved ? "Pago Getnet aprobado." : `Pago Getnet ${status.toLowerCase()}.`,
    });
  } catch (error) {
    return redirectToApp(request, {
      getnet_status: "pending",
      getnet_message: error instanceof Error ? error.message : "No se pudo consultar Getnet.",
    });
  }
}
