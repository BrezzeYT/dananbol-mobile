import type { Product, ApiCategory, CatalogPagination } from "../types";
import { API_INDEX, TGAPP_PRODUCTS_ROUTE } from "../config/constants";

export const CATALOG_PAGE_SIZE = 10;

export interface CatalogProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  search?: string;
  inStockOnly?: boolean;
  promoOnly?: boolean;
}

export interface CatalogMetaResponse {
  categories: ApiCategory[];
}

export interface CatalogProductsResponse {
  products: Product[];
  pagination: CatalogPagination;
}

function buildProductsUrl(params: CatalogProductsParams = {}): string {
  const query = new URLSearchParams();
  query.set("route", TGAPP_PRODUCTS_ROUTE);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? CATALOG_PAGE_SIZE));

  const category = params.category ?? "all";
  const subcategory = params.subcategory ?? "all";
  const search = (params.search ?? "").trim();

  if (subcategory !== "all") {
    query.set("subcategory", subcategory);
    if (!isNaN(Number(subcategory))) {
      query.set("category_id", subcategory);
    }
  } else if (category !== "all") {
    query.set("category", category);
    if (!isNaN(Number(category))) {
      query.set("category_id", category);
    }
  }

  if (search) query.set("search", search);
  if (params.inStockOnly) query.set("in_stock", "1");
  if (params.promoOnly) query.set("promo_only", "1");

  return `${API_INDEX}?${query.toString()}`;
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 800
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(fn, retries - 1, delayMs);
  }
}

export async function fetchCatalogMeta(): Promise<CatalogMetaResponse> {
  const query = new URLSearchParams({
    route: TGAPP_PRODUCTS_ROUTE,
    meta: "1",
  });
  const res = await fetch(`${API_INDEX}?${query.toString()}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchProducts(
  params: CatalogProductsParams = {}
): Promise<CatalogProductsResponse> {
  const res = await fetch(buildProductsUrl(params));
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
