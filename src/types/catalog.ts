import type { Product } from "./index";

export interface HomeCatalogSeed {
  requestKey: string;
  products: Product[];
  totalProducts: number;
  totalPages: number;
  error: string | null;
}
