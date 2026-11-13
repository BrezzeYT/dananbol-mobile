export interface Transaction {
  amount: number;
  description: string;
  date_added: string;
}

export interface TransactionsResponse {
  ok: boolean;
  error?: string;
  balance?: number;
  transactions?: Transaction[];
}

