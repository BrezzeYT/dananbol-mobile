export interface Product {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  subcategory?: string;
  subcategoryName?: string;
  company: string;
  spec: string;
  price: number;
  priceRegular?: number;
  isPromo?: boolean;
  quantity?: number;
  rating: number;
  avatar: string;
  description: string;
  tag?: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  count: number;
  subcategories?: { id: string; name: string }[];
}

export interface CatalogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
