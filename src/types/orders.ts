export interface Order {
  order_id: string;
  status: string;
  total: string;
  date_added: string;
}

export interface OrderProduct {
  name: string;
  quantity: number;
  price: string;
  total: string;
  avatar?: string;
}

export interface OrderTotal {
  title: string;
  value: string;
}

export interface OrderHistory {
  date_added: string;
  status: string;
  comment: string;
  description?: string;
}

export interface OrderDetails {
  order_id: number;
  status: string;
  recipient: string;
  address: string;
  products: OrderProduct[];
  totals: OrderTotal[];
  total_numeric: number;
  histories?: OrderHistory[];
}

export interface OrdersResponse {
  ok: boolean;
  error?: string;
  orders?: Order[];
}

export interface OrderDetailsResponse {
  ok: boolean;
  error?: string;
  details?: OrderDetails;
}

export interface PayOrderResponse {
  ok: boolean;
  paid?: boolean;
  order_id?: number;
  new_balance?: number;
  error?: string;
  shortfall?: number;
}

