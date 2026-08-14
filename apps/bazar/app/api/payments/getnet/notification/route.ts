import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  console.info("Getnet notification received", payload);

  return NextResponse.json({
    received: true,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Getnet notification endpoint ready.",
  });
}
