import { useState, useEffect, useMemo } from "react";
import type { ApiCategory } from "../types";
import { fetchProducts, CATALOG_PAGE_SIZE } from "../api/client";
import { useAppContext } from "../context/useAppContext";
import {
  buildCatalogFilterKey,
  buildCatalogRequestKey,
} from "../lib/catalogKeys";
import type { HomeCatalogSeed } from "../types/catalog";
import { useDebounce } from "./useDebounce";
import { SEARCH_DEBOUNCE_MS } from "../lib/performance";

interface UseCatalogParams {
  categories: ApiCategory[];
  categoryId: string;
  subcategoryId: string;
  searchQuery: string;
  inStockOnly: boolean;
  promoOnly: boolean;
}

function getActiveSubcategories(
  categories: ApiCategory[],
  categoryId: string
): { id: string; name: string }[] {
  if (categoryId === "all") return [];
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.subcategories ?? [];
}

function getCategoryDisplayName(
  categories: ApiCategory[],
  categoryId: string,
  subcategoryId: string
): string {
  if (categoryId === "all") return "Все товары";
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return "Каталог";
  if (subcategoryId !== "all") {
    const sub = cat.subcategories?.find((s) => s.id === subcategoryId);
    if (sub) return sub.name;
  }
  return cat.name;
}

export function useCatalog({
  categories,
  categoryId,
  subcategoryId,
  searchQuery,
  inStockOnly,
  promoOnly,
}: UseCatalogParams) {
  const { homeCatalogSeed } = useAppContext();
  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  const filterKey = buildCatalogFilterKey(
    categoryId,
    subcategoryId,
    debouncedSearch,
    inStockOnly,
    promoOnly
  );

  const [pagesByFilter, setPagesByFilter] = useState<Record<string, number>>({});
  const currentPage = pagesByFilter[filterKey] ?? 1;
  const requestKey = buildCatalogRequestKey(filterKey, currentPage);

  const [fetchState, setFetchState] = useState<HomeCatalogSeed | null>(() => {
    if (homeCatalogSeed?.requestKey === requestKey) return homeCatalogSeed;
    return null;
  });

  const isStale = fetchState === null || fetchState.requestKey !== requestKey;
  const isProductsLoading = isStale;
  const products = isStale ? [] : fetchState.products;
  const totalProducts = isStale ? 0 : fetchState.totalProducts;
  const totalPages = isStale ? 0 : fetchState.totalPages;
  const productsError = isStale ? null : fetchState.error;

  useEffect(() => {
    if (
      homeCatalogSeed?.requestKey === requestKey &&
      homeCatalogSeed.products.length > 0
    ) {
      setFetchState(homeCatalogSeed);
      return;
    }

    let cancelled = false;

    fetchProducts({
      page: currentPage,
      limit: CATALOG_PAGE_SIZE,
      category: categoryId,
      subcategory: subcategoryId,
      search: debouncedSearch,
      inStockOnly,
      promoOnly,
    })
      .then((data) => {
        if (cancelled) return;
        setFetchState({
          requestKey,
          products: data.products,
          totalProducts: data.pagination.total,
          totalPages: data.pagination.totalPages,
          error: null,
        });
        if (data.pagination.page !== currentPage) {
          setPagesByFilter((prev) => ({
            ...prev,
            [filterKey]: data.pagination.page,
          }));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch products:", err);
        setFetchState({
          requestKey,
          products: [],
          totalProducts: 0,
          totalPages: 0,
          error: "Не удалось загрузить товары",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    requestKey,
    currentPage,
    categoryId,
    subcategoryId,
    debouncedSearch,
    filterKey,
    inStockOnly,
    promoOnly,
    homeCatalogSeed,
  ]);

  const subcategories = useMemo(
    () => getActiveSubcategories(categories, categoryId),
    [categories, categoryId]
  );

  const categoryTitle = useMemo(
    () => getCategoryDisplayName(categories, categoryId, subcategoryId),
    [categories, categoryId, subcategoryId]
  );

  const handlePageChange = (page: number) => {
    setPagesByFilter((prev) => ({ ...prev, [filterKey]: page }));
  };

  return {
    catalogViewKey: requestKey,
    currentPage,
    products,
    totalProducts,
    totalPages,
    isProductsLoading,
    productsError,
    subcategories,
    categoryTitle,
    handlePageChange,
  };
}
