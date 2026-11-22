export interface Address {
  id: string;
  address: string;
  is_valid?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  dadata_name?: string;
}

export interface PostalOfficeAddress {
  settlementTypeOrCityType?: string;
  settlementOrCity?: string;
  shortAddress?: string;
  region?: string;
}

export interface PostalOfficeLookupResponse {
  success?: boolean;
  error?: string;
  zone_id?: number | string | null;
  zone_name?: string | null;
  region_name?: string | null;
  data?: Array<{
    address?: PostalOfficeAddress;
    typeCode?: string;
  }>;
}

export interface AddressesResponse {
  ok: boolean;
  addresses?: Address[];
  zones?: Zone[];
  error?: string;
}

export interface CreateAddressData {
  firstname: string;
  lastname: string;
  city: string;
  postcode: string;
  address_1: string;
  zone_id: number;
  country_id?: number;
}

export interface CreateAddressResponse {
  ok: boolean;
  address?: Address;
  error?: string;
}

