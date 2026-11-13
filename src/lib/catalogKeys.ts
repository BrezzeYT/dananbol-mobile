export function buildCatalogFilterKey(
  categoryId: string,
  subcategoryId: string,
  searchQuery: string,
  inStockOnly: boolean,
  promoOnly: boolean = false
): string {
  return `${categoryId}|${subcategoryId}|${searchQuery}|${inStockOnly ? 1 : 0}|${promoOnly ? 1 : 0}`;
}

export function buildCatalogRequestKey(filterKey: string, page: number): string {
  return `${filterKey}|${page}`;
}

export const DEFAULT_HOME_FILTER_KEY = buildCatalogFilterKey(
  "all",
  "all",
  "",
  false,
  false
);

export const DEFAULT_HOME_REQUEST_KEY = buildCatalogRequestKey(
  DEFAULT_HOME_FILTER_KEY,
  1
);
