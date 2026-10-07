import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBackendGraphqlUrl() {
  const explicit = process.env.GRAPHQL_URL;

  if (explicit) {
    return explicit;
  }

  const apiBase = (process.env.API_URL || "").replace(/\/$/, "");

  if (apiBase) {
    return `${apiBase}/graphql`;
  }

  return "http://backend:3001/graphql";
}

function getStorefrontSecret() {
  const secret = process.env.MARKET_STOREFRONT_SECRET;

  if (!secret) {
    throw new Error("MARKET_STOREFRONT_SECRET não configurada no market.");
  }

  return secret;
}

async function proxyGraphql(request: NextRequest) {
  let secret: string;

  try {
    secret = getStorefrontSecret();
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        errors: [
          {
            message: "Proxy da vitrine mal configurado.",
          },
        ],
      },
      { status: 500 },
    );
  }

  const backendUrl = getBackendGraphqlUrl();
  const incomingBody = await request.text();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Mcasa-Storefront-Key": secret,
  };

  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.Authorization = authorization;
  }

  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: incomingBody,
      cache: "no-store",
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Falha ao encaminhar GraphQL da vitrine.");
    console.error(error);

    return NextResponse.json(
      {
        errors: [
          {
            message: "Não foi possível falar com a API.",
          },
        ],
      },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  return proxyGraphql(request);
}
