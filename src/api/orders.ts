import { MOBILE_API_ROUTE } from '../config/constants';
import { buildMobileUrl, getMobileHeaders, handleApiResponse } from './common';
import type {
  OrdersResponse,
  OrderDetailsResponse,
  PayOrderResponse,
} from '../types/orders';

export async function fetchMobileOrders(token: string): Promise<OrdersResponse> {
  if (!token) {
    return { ok: false, error: 'Not authorized' };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: 'orders',
    token,
  });

  const res = await fetch(url, {
    headers: getMobileHeaders({}, token),
  });

  return handleApiResponse<OrdersResponse>(res, 'orders');
}

export async function fetchMobileOrderDetails(
  token: string,
  orderId: string | number
): Promise<OrderDetailsResponse> {
  if (!token) {
    return { ok: false, error: 'Not authorized' };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: 'orders',
    order_id: String(orderId),
    token,
  });

  const res = await fetch(url, {
    headers: getMobileHeaders({}, token),
  });

  return handleApiResponse<OrderDetailsResponse>(res);
}

export async function payMobileOrder(
  token: string,
  orderId: number
): Promise<PayOrderResponse> {
  if (!token) {
    return { ok: false, error: 'Not authorized' };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: 'orders',
    subaction: 'pay',
    order_id: String(orderId),
    token,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: getMobileHeaders({
      'Content-Type': 'application/json',
    }, token),
    body: JSON.stringify({ order_id: orderId, token }),
  });

  return handleApiResponse<PayOrderResponse>(res);
}
