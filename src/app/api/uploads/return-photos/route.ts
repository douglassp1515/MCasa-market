import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBackendApiBase() {
  const apiBase = (process.env.API_URL || "").replace(/\/$/, "");

  if (apiBase) {
    return apiBase;
  }

  return "http://backend:3001";
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { message: "Autenticação de comprador necessária." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const upstream = await fetch(
      `${getBackendApiBase()}/api/marketplace-returns/images`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
        },
        body: formData,
        cache: "no-store",
      },
    );

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Falha no proxy de upload de devolução.");
    console.error(error);
    return NextResponse.json(
      { message: "Não foi possível enviar a foto." },
      { status: 502 },
    );
  }
}
