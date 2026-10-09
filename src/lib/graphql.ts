import { ClientError, GraphQLClient, gql } from "graphql-request";

import {
  getBuyerToken,
  invalidateBuyerSession,
  isGraphqlAuthFailure,
} from "@/lib/auth";

export const DEFAULT_ACCENT = "#2563EB";
export const DEFAULT_SURFACE = "#EFF6FF";

export type MarketplaceCategory = {
  id: number;
  name: string;
  slug: string;
  accentColor: string;
  surfaceColor: string;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
};

export type HeroSlide = {
  id: number;
  categoryId: number;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  active: boolean;
  category: MarketplaceCategory | null;
};

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
  brand: string | null;
  salePrice: number;
  thumbnailUrl: string | null;
  category: MarketplaceCategory | null;
};

export type PublicListingVariant = {
  id: number;
  sku: string;
  attributesJson: string;
  salePrice: number | null;
  stockAvailable: number;
  active: boolean;
};

export type VariationAxis = {
  code: string;
  name: string;
};

export type PublicListingDetail = PublicListing & {
  images: Array<{
    id: number;
    url: string;
    sortOrder: number;
  }>;
  variationAxes: VariationAxis[];
  variants: PublicListingVariant[];
};

export function parseVariantAttributes(
  attributesJson: string,
): Record<string, string> {
  try {
    const parsed = JSON.parse(attributesJson) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (value == null) {
        continue;
      }

      result[key] = String(value);
    }

    return result;
  } catch {
    return {};
  }
}

export function formatVariantLabel(
  variant: PublicListingVariant,
  axes: VariationAxis[] = [],
): string {
  const attrs = parseVariantAttributes(variant.attributesJson);
  const parts: string[] = [];

  for (const axis of axes) {
    const value = attrs[axis.code] ?? attrs[axis.name];

    if (value) {
      parts.push(`${axis.name}: ${value}`);
    }
  }

  if (parts.length === 0) {
    for (const [key, value] of Object.entries(attrs)) {
      parts.push(`${key}: ${value}`);
    }
  }

  if (parts.length === 0) {
    return variant.sku;
  }

  return parts.join(" · ");
}

export type MarketplaceBuyer = {
  id: number;
  email: string;
  name: string;
};

export type MarketplaceBuyerAddress = {
  id: number;
  label: string | null;
  recipientName: string;
  phone: string | null;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceBuyerAddressInput = {
  label?: string | null;
  recipientName: string;
  phone?: string | null;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
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
  deliveryAddressId: number;
  paymentId: number | null;
  listingId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  listingTitle: string | null;
  channel: string;
  hasReturn: boolean;
  returnStatus: string;
  returnReason: string | null;
  returnedAt: string | null;
  returnPhotoUrls: string[];
};

export type MarketplacePayment = {
  id: number;
  amount: number;
  method: string;
  status: string;
  provider: string;
  providerPaymentId: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: string | null;
  cardLastFour: string | null;
  cardBrand: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  simulated: boolean;
};

export type MarketplaceCheckoutGroup = {
  companyId: number;
  companyTradeName: string | null;
  companyLegalName: string;
  orders: MarketplaceOrder[];
  groupTotal: number;
};

export type MarketplaceCheckoutResult = {
  groups: MarketplaceCheckoutGroup[];
  orders: MarketplaceOrder[];
  totalAmount: number;
  payment: MarketplacePayment;
};

const BUYER_FIELDS = `
  id
  email
  name
`;

const ADDRESS_FIELDS = `
  id
  label
  recipientName
  phone
  street
  number
  complement
  district
  city
  state
  zipCode
  isDefault
  createdAt
  updatedAt
`;

const ORDER_FIELDS = `
  id
  companyId
  companyTradeName
  companyLegalName
  deliveryAddressId
  paymentId
  listingId
  productId
  quantity
  unitPrice
  totalAmount
  status
  createdAt
  listingTitle
  channel
`;

const PAYMENT_FIELDS = `
  id
  amount
  method
  status
  provider
  providerPaymentId
  pixQrCode
  pixQrCodeBase64
  pixExpiresAt
  cardLastFour
  cardBrand
  failureReason
  paidAt
  createdAt
  updatedAt
  simulated
`;

const CATEGORY_FIELDS = `
  id
  name
  slug
  accentColor
  surfaceColor
  imageUrl
  sortOrder
  active
`;

const LISTING_CARD_FIELDS = `
  id
  companyId
  companyTradeName
  companyLegalName
  productId
  channel
  status
  title
  description
  brand
  salePrice
  thumbnailUrl
  category {
    ${CATEGORY_FIELDS}
  }
`;

/**
 * No browser: BFF same-origin (URL absoluta — graphql-request exige URL válida).
 * O Route Handler `/api/graphql` injeta o secret no servidor.
 * Em SSR: GRAPHQL_URL interno do backend.
 */
function getGraphqlUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/graphql`;
  }

  const explicit = process.env.GRAPHQL_URL;

  if (explicit) {
    return explicit;
  }

  const publicUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (publicUrl) {
    return publicUrl;
  }

  throw new Error(
    "GRAPHQL_URL (ou NEXT_PUBLIC_GRAPHQL_URL) não configurada no servidor.",
  );
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

  // Secret só no servidor (BFF ou SSR). Nunca NEXT_PUBLIC_ / nunca no browser.
  if (typeof window === "undefined") {
    const secret = process.env.MARKET_STOREFRONT_SECRET;

    if (secret) {
      headers["X-Mcasa-Storefront-Key"] = secret;
    }
  }

  if (authenticated) {
    const token = getBuyerToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return new GraphQLClient(getGraphqlUrl(), { headers });
}

export function formatGraphqlError(error: unknown): string {
  if (isGraphqlAuthFailure(error)) {
    invalidateBuyerSession();

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/cadastro")
    ) {
      const next = window.location.pathname + window.location.search;
      window.location.assign(
        `/login?next=${encodeURIComponent(next || "/")}`,
      );
    }
  }

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

export async function fetchPublicCategories(): Promise<MarketplaceCategory[]> {
  const client = createClient(false);
  const query = gql`
    query PublicCategories {
      publicCategories {
        ${CATEGORY_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      publicCategories: MarketplaceCategory[];
    }>(query);

    return data.publicCategories;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchPublicHeroSlides(): Promise<HeroSlide[]> {
  const client = createClient(false);
  const query = gql`
    query PublicHeroSlides {
      publicHeroSlides {
        id
        categoryId
        imageUrl
        title
        subtitle
        ctaLabel
        ctaHref
        sortOrder
        active
        category {
          ${CATEGORY_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await client.request<{ publicHeroSlides: HeroSlide[] }>(query);
    return data.publicHeroSlides;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchPublicCategory(
  slug: string,
): Promise<MarketplaceCategory | null> {
  const client = createClient(false);
  const query = gql`
    query PublicCategory($slug: String!) {
      publicCategory(slug: $slug) {
        ${CATEGORY_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      publicCategory: MarketplaceCategory | null;
    }>(query, { slug });

    return data.publicCategory;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchPublicListings(input?: {
  search?: string;
  channel?: string;
  categorySlug?: string;
}): Promise<PublicListing[]> {
  const client = createClient(false);
  const query = gql`
    query PublicListings(
      $search: String
      $channel: String
      $categorySlug: String
    ) {
      publicListings(
        search: $search
        channel: $channel
        categorySlug: $categorySlug
      ) {
        ${LISTING_CARD_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{ publicListings: PublicListing[] }>(
      query,
      {
        search: input?.search || null,
        channel: input?.channel || null,
        categorySlug: input?.categorySlug || null,
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
        ${LISTING_CARD_FIELDS}
        images {
          id
          url
          sortOrder
        }
        variationAxes {
          code
          name
        }
        variants {
          id
          sku
          attributesJson
          salePrice
          stockAvailable
          active
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      publicListing: PublicListingDetail | null;
    }>(query, { id });

    if (!data.publicListing) {
      return null;
    }

    return {
      ...data.publicListing,
      variationAxes: data.publicListing.variationAxes || [],
      variants: data.publicListing.variants || [],
    };
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
          ${BUYER_FIELDS}
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
          ${BUYER_FIELDS}
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
        ${BUYER_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      meMarketplaceBuyer: MarketplaceBuyer | null;
    }>(query);

    return data.meMarketplaceBuyer;
  } catch (error) {
    if (isGraphqlAuthFailure(error)) {
      invalidateBuyerSession();
      return null;
    }

    throw new Error(formatGraphqlError(error));
  }
}

/** Em calls autenticadas: se o token caiu, limpa sessão local. */
export function logoutBuyerIfAuthFailed(error: unknown): boolean {
  if (!isGraphqlAuthFailure(error)) {
    return false;
  }

  invalidateBuyerSession();
  return true;
}

export async function fetchMyMarketplaceDeliveryAddresses(): Promise<
  MarketplaceBuyerAddress[]
> {
  const client = createClient(true);
  const query = gql`
    query MyMarketplaceDeliveryAddresses {
      myMarketplaceDeliveryAddresses {
        ${ADDRESS_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      myMarketplaceDeliveryAddresses: MarketplaceBuyerAddress[];
    }>(query);

    return data.myMarketplaceDeliveryAddresses;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function createMarketplaceDeliveryAddress(
  input: MarketplaceBuyerAddressInput,
): Promise<MarketplaceBuyerAddress> {
  const client = createClient(true);
  const mutation = gql`
    mutation CreateMarketplaceDeliveryAddress(
      $input: MarketplaceBuyerAddressInput!
    ) {
      createMarketplaceDeliveryAddress(input: $input) {
        ${ADDRESS_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      createMarketplaceDeliveryAddress: MarketplaceBuyerAddress;
    }>(mutation, { input });

    return data.createMarketplaceDeliveryAddress;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function updateMarketplaceDeliveryAddress(
  id: number,
  input: Partial<MarketplaceBuyerAddressInput>,
): Promise<MarketplaceBuyerAddress> {
  const client = createClient(true);
  const mutation = gql`
    mutation UpdateMarketplaceDeliveryAddress(
      $id: Int!
      $input: UpdateMarketplaceBuyerAddressInput!
    ) {
      updateMarketplaceDeliveryAddress(id: $id, input: $input) {
        ${ADDRESS_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      updateMarketplaceDeliveryAddress: MarketplaceBuyerAddress;
    }>(mutation, { id, input });

    return data.updateMarketplaceDeliveryAddress;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function deleteMarketplaceDeliveryAddress(
  id: number,
): Promise<boolean> {
  const client = createClient(true);
  const mutation = gql`
    mutation DeleteMarketplaceDeliveryAddress($id: Int!) {
      deleteMarketplaceDeliveryAddress(id: $id)
    }
  `;

  try {
    const data = await client.request<{
      deleteMarketplaceDeliveryAddress: boolean;
    }>(mutation, { id });

    return data.deleteMarketplaceDeliveryAddress;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function setDefaultMarketplaceDeliveryAddress(
  id: number,
): Promise<MarketplaceBuyerAddress> {
  const client = createClient(true);
  const mutation = gql`
    mutation SetDefaultMarketplaceDeliveryAddress($id: Int!) {
      setDefaultMarketplaceDeliveryAddress(id: $id) {
        ${ADDRESS_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      setDefaultMarketplaceDeliveryAddress: MarketplaceBuyerAddress;
    }>(mutation, { id });

    return data.setDefaultMarketplaceDeliveryAddress;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function createMarketplaceOrder(input: {
  listingId: number;
  quantity: number;
  deliveryAddressId: number;
}): Promise<MarketplaceOrder> {
  const client = createClient(true);
  const mutation = gql`
    mutation CreateMarketplaceOrder(
      $listingId: Int!
      $quantity: Float!
      $deliveryAddressId: Int!
    ) {
      createMarketplaceOrder(
        listingId: $listingId
        quantity: $quantity
        deliveryAddressId: $deliveryAddressId
      ) {
        ${ORDER_FIELDS}
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

export async function createMarketplaceCheckout(input: {
  items: Array<{
    listingId: number;
    quantity: number;
    productVariantId?: number | null;
  }>;
  deliveryAddressId: number;
  paymentMethod: "PIX" | "CARD";
  paymentProvider?: "mercadopago" | "stripe" | null;
  cardToken?: string | null;
  installments?: number | null;
  paymentMethodId?: string | null;
  issuerId?: string | null;
  cardLastFour?: string | null;
  cardBrand?: string | null;
}): Promise<MarketplaceCheckoutResult> {
  const client = createClient(true);
  const mutation = gql`
    mutation CreateMarketplaceCheckout(
      $items: [MarketplaceCheckoutItemInput!]!
      $deliveryAddressId: Int!
      $paymentMethod: String!
      $paymentProvider: String
      $cardToken: String
      $installments: Int
      $paymentMethodId: String
      $issuerId: String
      $cardLastFour: String
      $cardBrand: String
    ) {
      createMarketplaceCheckout(
        items: $items
        deliveryAddressId: $deliveryAddressId
        paymentMethod: $paymentMethod
        paymentProvider: $paymentProvider
        cardToken: $cardToken
        installments: $installments
        paymentMethodId: $paymentMethodId
        issuerId: $issuerId
        cardLastFour: $cardLastFour
        cardBrand: $cardBrand
      ) {
        totalAmount
        payment {
          ${PAYMENT_FIELDS}
        }
        orders {
          ${ORDER_FIELDS}
        }
        groups {
          companyId
          companyTradeName
          companyLegalName
          groupTotal
          orders {
            ${ORDER_FIELDS}
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      createMarketplaceCheckout: MarketplaceCheckoutResult;
    }>(mutation, {
      items: input.items.map((item) => ({
        listingId: item.listingId,
        quantity: item.quantity,
        productVariantId: item.productVariantId || null,
      })),
      deliveryAddressId: input.deliveryAddressId,
      paymentMethod: input.paymentMethod,
      paymentProvider: input.paymentProvider || null,
      cardToken: input.cardToken || null,
      installments: input.installments || null,
      paymentMethodId: input.paymentMethodId || null,
      issuerId: input.issuerId || null,
      cardLastFour: input.cardLastFour || null,
      cardBrand: input.cardBrand || null,
    });

    return data.createMarketplaceCheckout;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchMarketplacePayment(
  id: number,
): Promise<MarketplacePayment> {
  const client = createClient(true);
  const query = gql`
    query MarketplacePayment($id: Int!) {
      marketplacePayment(id: $id) {
        ${PAYMENT_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      marketplacePayment: MarketplacePayment;
    }>(query, { id });

    return data.marketplacePayment;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function confirmSimulatedMarketplacePayment(
  id: number,
): Promise<MarketplacePayment> {
  const client = createClient(true);
  const mutation = gql`
    mutation ConfirmSimulatedMarketplacePayment($id: Int!) {
      confirmSimulatedMarketplacePayment(id: $id) {
        ${PAYMENT_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      confirmSimulatedMarketplacePayment: MarketplacePayment;
    }>(mutation, { id });

    return data.confirmSimulatedMarketplacePayment;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function refreshMarketplacePayment(
  id: number,
): Promise<MarketplacePayment> {
  const client = createClient(true);
  const mutation = gql`
    mutation RefreshMarketplacePayment($id: Int!) {
      refreshMarketplacePayment(id: $id) {
        ${PAYMENT_FIELDS}
      }
    }
  `;

  try {
    const data = await client.request<{
      refreshMarketplacePayment: MarketplacePayment;
    }>(mutation, { id });

    return data.refreshMarketplacePayment;
  } catch (error) {
    throw new Error(formatGraphqlError(error));
  }
}

export async function fetchMyMarketplaceOrders(): Promise<MarketplaceOrder[]> {
  const client = createClient(true);
  const query = gql`
    query MyMarketplaceOrders {
      myMarketplaceOrders {
        ${ORDER_FIELDS}
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
