import { MOBILE_API_ROUTE, API_INDEX } from "../config/constants";
import { buildMobileUrl, getMobileHeaders, handleApiResponse } from "./common";
import type {
  Address,
  AddressesResponse,
  CreateAddressData,
  CreateAddressResponse,
} from "../types/addresses";

export async function fetchMobileAddresses(
  token: string,
): Promise<AddressesResponse> {
  if (!token) {
    return { ok: false, error: "Not authorized" };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: "addresses",
    token,
  });

  const res = await fetch(url, {
    headers: getMobileHeaders({}, token),
  });

  return handleApiResponse<AddressesResponse>(res, "addresses");
}

export async function createMobileAddress(
  token: string,
  data: CreateAddressData,
): Promise<CreateAddressResponse> {
  if (!token) {
    return { ok: false, error: "Not authorized" };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: "addresses",
    subaction: "create",
    token,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: getMobileHeaders(
      {
        "Content-Type": "application/json",
      },
      token,
    ),
    body: JSON.stringify({ ...data, token }),
  });

  return handleApiResponse<CreateAddressResponse>(res);
}

export async function deleteMobileAddress(
  token: string,
  addressId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!token) {
    return { ok: false, error: "Not authorized" };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: "addresses",
    subaction: "delete",
    address_id: addressId,
    token,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: getMobileHeaders(
      {
        "Content-Type": "application/json",
      },
      token,
    ),
    body: JSON.stringify({ address_id: addressId, token }),
  });

  return handleApiResponse<{ ok: boolean; error?: string }>(res);
}

export async function lookupPostalOffice(zip: string): Promise<any> {
  const cleanZip = zip.replace(/\D/g, "").slice(0, 6);
  if (cleanZip.length !== 6) {
    throw new Error("Индекс должен состоять из 6 цифр");
  }

  try {
    const mobileUrl = buildMobileUrl(MOBILE_API_ROUTE, {
      action: "pochta",
      postal_code: cleanZip,
    });
    const res = await fetch(mobileUrl, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.success !== undefined || data.data || data.error)) {
        return data;
      }
    }
  } catch (e) {
    console.debug("Mobile pochta lookup error, trying direct OpenCart API:", e);
  }

  const directUrl = `${API_INDEX}?route=api/pochta/findByPostalId&postal_code=${encodeURIComponent(cleanZip)}`;
  const directRes = await fetch(directUrl, {
    headers: { Accept: "application/json" },
  });
  if (!directRes.ok) {
    throw new Error(`Ошибка почтового сервиса (${directRes.status})`);
  }
  return directRes.json();
}
