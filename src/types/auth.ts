export interface CustomerProfile {
  customer_id: number;
  encrypt_customer_token?: string;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  balance: number;
  tg_inform?: string;
}

export interface AuthSessionResponse {
  loggedIn: boolean;
  customer?: CustomerProfile;
}

export interface AuthActionResponse {
  ok: boolean;
  error?: string;
  token?: string;
  customer?: CustomerProfile;
}
