import { MOBILE_API_ROUTE } from "../config/constants";
import { buildMobileUrl, getMobileHeaders, handleApiResponse } from "./common";
import type { TransactionsResponse } from "../types/transactions";

export async function fetchMobileTransactions(
  token: string,
): Promise<TransactionsResponse> {
  if (!token) {
    return { ok: false, error: "Not authorized" };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: "transactions",
    token,
  });

  const res = await fetch(url, {
    headers: getMobileHeaders({}, token),
  });

  return handleApiResponse<TransactionsResponse>(res);
}
