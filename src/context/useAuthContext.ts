import { createContext, useContext } from 'react';
import type { CustomerProfile } from '../types/auth';

export interface AuthContextType {
  token: string;
  customer: CustomerProfile | null;
  isAuthLoading: boolean;
  isLoggedIn: boolean;
  authError: string | null;
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: {
    email: string;
    password: string;
    confirm_password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
