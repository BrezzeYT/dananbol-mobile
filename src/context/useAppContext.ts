import { createContext, useContext } from "react";
import type { Product, ApiCategory } from "../types";
import type { HomeCatalogSeed } from "../types/catalog";

export interface AppContextType {
  categories: ApiCategory[];
  isCatalogLoading: boolean;
  isAppReady: boolean;
  catalogError: string | null;
  homeCatalogSeed: HomeCatalogSeed | null;
  addingId: number | null;
  handleBuyClick: (product: Product) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
