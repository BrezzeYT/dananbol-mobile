import { MOBILE_API_ROUTE } from '../config/constants';
import { buildMobileUrl, getMobileHeaders, handleApiResponse } from './common';

export interface QuoteItem {
  product_id: number;
  quantity: number;
}

export interface QuoteLine {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
  discounted_total?: number;
  thumb?: string;
}

export interface QuoteResult {
  ok: true;
  balance: number;
  data: {
    lines: QuoteLine[];
    gift_products?: QuoteLine[];
    subtotal: number;
    discount: number;
    volume_discount?: number;
    volume_discount_percent?: number;
    shipping: number;
    insurance?: number;
    total: number;
    currency: string;
    coupon_valid?: boolean;
    coupon_error?: string;
    gift_valid?: boolean;
    gift_error?: string;
  };
}

export interface QuoteError {
  ok: false;
  error: string | { code: string; message: string };
}

export type QuoteResponse = QuoteResult | QuoteError;

export interface CreateOrderPayload {
  address_id: number;
  items: QuoteItem[];
  coupon_code?: string;
  gift_code?: string;
  strah: boolean;
  comment?: string;
  idempotency_key: string;
}

export interface CreateOrderSuccess {
  ok: true;
  order_id: number;
  paid: boolean;
  shortfall?: number;
  manager_link: string;
}

export interface CreateOrderError {
  ok: false;
  error: string;
  order_id?: number;
  shortfall?: number;
  topup_link?: string;
}

export type CreateOrderResponse = CreateOrderSuccess | CreateOrderError;

export async function fetchMobileQuote(
  token: string,
  items: QuoteItem[],
  coupon_code: string,
  gift_code: string,
  strah: boolean,
): Promise<QuoteResponse> {
  const url = buildMobileUrl(`${MOBILE_API_ROUTE}/checkout`, { action: 'quote' });
  const res = await fetch(url, {
    method: 'POST',
    headers: getMobileHeaders({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify({ items, coupon_code, gift_code, strah }),
  });
  return handleApiResponse<QuoteResponse>(res);
}

export async function createMobileOrder(
  token: string,
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> {
  const url = buildMobileUrl(`${MOBILE_API_ROUTE}/checkout`, { action: 'create_order' });
  const res = await fetch(url, {
    method: 'POST',
    headers: getMobileHeaders({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(payload),
  });
  return handleApiResponse<CreateOrderResponse>(res);
}

