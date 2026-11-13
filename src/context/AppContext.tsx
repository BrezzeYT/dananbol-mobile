import React, { useState, useEffect, useCallback } from "react";
import type { Product } from "../types";
import {
  fetchCatalogMeta,
  fetchProducts,
  fetchWithRetry,
  CATALOG_PAGE_SIZE,
} from "../api/client";
import type { HomeCatalogSeed } from "../types/catalog";
import { DEFAULT_HOME_REQUEST_KEY } from "../lib/catalogKeys";
import { AppContext } from "./useAppContext";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<
    import("../types").ApiCategory[]
  >([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [homeCatalogSeed, setHomeCatalogSeed] =
    useState<HomeCatalogSeed | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = () =>
      Promise.all([
        fetchCatalogMeta(),
        fetchProducts({
          page: 1,
          limit: CATALOG_PAGE_SIZE,
          category: "all",
          subcategory: "all",
          inStockOnly: false,
        }),
      ]);

    fetchWithRetry(loadData, 3, 800)
      .then(([meta, catalog]) => {
        if (cancelled) return;
        setCategories(Array.isArray(meta.categories) ? meta.categories : []);
        setHomeCatalogSeed({
          requestKey: DEFAULT_HOME_REQUEST_KEY,
          products: catalog.products,
          totalProducts: catalog.pagination.total,
          totalPages: catalog.pagination.totalPages,
          error: null,
        });
        setCatalogError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Catalog bootstrap failed:", err);
        setCatalogError("Не удалось загрузить каталог");
        setHomeCatalogSeed(null);
      })
      .finally(() => {
        if (!cancelled) setIsCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuyClick = useCallback((product: Product) => {
    setAddingId(product.id);
    setTimeout(() => setAddingId(null), 600);
  }, []);

  return (
    <AppContext.Provider
      value={{
        categories,
        isCatalogLoading,
        isAppReady:
          !isCatalogLoading &&
          (categories.length > 0 ||
            homeCatalogSeed !== null ||
            catalogError !== null),
        catalogError,
        homeCatalogSeed,
        addingId,
        handleBuyClick,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
