import { ClientError, GraphQLClient, gql } from "graphql-request";

import { getBuyerToken } from "@/lib/auth";

export type PublicListing = {
  id: number;
  companyId: number;
  companyTradeName: string | null;
  companyLegalName: string;
  productId: number;
  channel: string;
  status: string;
  title: string | null;
  description: string | null;
  salePrice: number;
  thumbnailUrl: string | null;
};

export type PublicListingDetail = PublicListing & {
  images: Array<{
    id: number;
    url: string;
    sortOrder: number;
  }>;
};

export type MarketplaceBuyer = {
  id: number;
  email: string;
  name: string;
};

export type MarketplaceBuyerAuth = {
  token: string;
  buyer: MarketplaceBuyer;
};

export type MarketplaceOrder = {
  id: number;
  companyId: number;
  companyTradeName: string | null;
  companyLegalName: string;
  listingId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  listingTitle: string | null;
  channel: string;
};

function getGraphqlUrl() {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_GRAPHQL_URL não configurada.");
  }

  return url;
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = getApiBaseUrl().replace(/\/$/, "");

  if (!base) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${base}${path}`;
  }

  return `${base}/${path}`;
}

function createClient(authenticated: boolean) {
  const headers: Record<string, string> = {};

  if (authenticated) {
    const token = getBuyerToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return new GraphQLClient(getGraphqlUrl(), { headers });
}

export function formatGraphqlError(error: unknown): string {
  if (error instanceof ClientError) {
    const first = error.response.errors?.[0]?.message;

    if (first) {
      return first;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Falha inesperada na comunicação com a API.";
}

export async function fetchPublicListings(input?: {
  search?: string;
  channel?: string;
}): Promise<PublicListing[]> {
  const client = createClient(false);
  const query = gql`
    query PublicListings($search: String, $channel: String) {
      publicListings(search: $search, channel: $channel) {
        id
        companyId
        companyTradeName
        companyLegalName
        productId
        channel
        status
        title
        description
        salePrice
        thumbnailUrl
      }
    }
  `;

  try {
    const data = await client.request<{ publicListings: PublicListing[] }>(
      query,
      {
        search: input?.search || null,
        channel: input?.channel || null,
      },
    );

    return data.publicListings;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchPublicListing(
  id: number,
): Promise<PublicListingDetail | null> {
  const client = createClient(false);
  const query = gql`
    query PublicListing($id: Int!) {
      publicListing(id: $id) {
        id
        companyId
        companyTradeName
        companyLegalName
        productId
        channel
        status
        title
        description
        salePrice
        thumbnailUrl
        images {
          id
          url
          sortOrder
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      publicListing: PublicListingDetail | null;
    }>(query, { id });

    return data.publicListing;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function registerMarketplaceBuyer(input: {
  email: string;
  name: string;
  password: string;
}): Promise<MarketplaceBuyerAuth> {
  const client = createClient(false);
  const mutation = gql`
    mutation RegisterMarketplaceBuyer(
      $email: String!
      $name: String!
      $password: String!
    ) {
      registerMarketplaceBuyer(
        email: $email
        name: $name
        password: $password
      ) {
        token
        buyer {
          id
          email
          name
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      registerMarketplaceBuyer: MarketplaceBuyerAuth;
    }>(mutation, input);

    return data.registerMarketplaceBuyer;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function loginMarketplaceBuyer(input: {
  email: string;
  password: string;
}): Promise<MarketplaceBuyerAuth> {
  const client = createClient(false);
  const mutation = gql`
    mutation LoginMarketplaceBuyer($email: String!, $password: String!) {
      loginMarketplaceBuyer(email: $email, password: $password) {
        token
        buyer {
          id
          email
          name
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      loginMarketplaceBuyer: MarketplaceBuyerAuth;
    }>(mutation, input);

    return data.loginMarketplaceBuyer;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchMeMarketplaceBuyer(): Promise<MarketplaceBuyer | null> {
  const client = createClient(true);
  const query = gql`
    query MeMarketplaceBuyer {
      meMarketplaceBuyer {
        id
        email
        name
      }
    }
  `;

  try {
    const data = await client.request<{
      meMarketplaceBuyer: MarketplaceBuyer | null;
    }>(query);

    return data.meMarketplaceBuyer;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function createMarketplaceOrder(input: {
  listingId: number;
  quantity: number;
}): Promise<MarketplaceOrder> {
  const client = createClient(true);
  const mutation = gql`
    mutation CreateMarketplaceOrder($listingId: Int!, $quantity: Float!) {
      createMarketplaceOrder(listingId: $listingId, quantity: $quantity) {
        id
        companyId
        companyTradeName
        companyLegalName
        listingId
        productId
        quantity
        unitPrice
        totalAmount
        status
        createdAt
        listingTitle
        channel
      }
    }
  `;

  try {
    const data = await client.request<{
      createMarketplaceOrder: MarketplaceOrder;
    }>(mutation, input);

    return data.createMarketplaceOrder;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchMyMarketplaceOrders(): Promise<MarketplaceOrder[]> {
  const client = createClient(true);
  const query = gql`
    query MyMarketplaceOrders {
      myMarketplaceOrders {
        id
        companyId
        companyTradeName
        companyLegalName
        listingId
        productId
        quantity
        unitPrice
        totalAmount
        status
        createdAt
        listingTitle
        channel
      }
    }
  `;

  try {
    const data = await client.request<{
      myMarketplaceOrders: MarketplaceOrder[];
    }>(query);

    return data.myMarketplaceOrders;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}
