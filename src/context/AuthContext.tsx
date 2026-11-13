import React, { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  fetchMobileSession,
  loginMobileCustomer,
  logoutMobileCustomer,
  registerMobileCustomer,
} from '../api/auth';
import {
  getOrCreateDeviceId,
  getSavedAuthToken,
  saveAuthToken,
  removeAuthToken,
} from '../lib/deviceId';
import type { CustomerProfile } from '../types/auth';
import { AuthContext } from './useAuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    Promise.all([getOrCreateDeviceId(), getSavedAuthToken()]).then(
      ([dId, savedToken]) => {
        setDeviceId(dId);
        if (savedToken) {
          setToken(savedToken);
          fetchMobileSession(savedToken)
            .then((data) => {
              if (data.loggedIn && data.customer) {
                setCustomer(data.customer);
              } else {
                removeAuthToken();
                setToken('');
                setCustomer(null);
              }
            })
            .catch(() => {})
            .finally(() => {
              setIsAuthLoading(false);
            });
        } else {
          setIsAuthLoading(false);
        }
      }
    );
  }, []);

  const refreshSession = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchMobileSession(token);
      if (data.loggedIn && data.customer) {
        setCustomer(data.customer);
      }
      setAuthError(null);
    } catch (err) {
      console.error('Mobile session refresh failed:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      refreshSession();
    }, 15000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshSession();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [token, refreshSession]);

  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
    setAuthError(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        const res = await loginMobileCustomer(email.trim(), password, deviceId);
        if (!res.ok || !res.customer || !res.token) {
          setAuthError(res.error || 'Ошибка входа');
          return false;
        }
        await saveAuthToken(res.token);
        setToken(res.token);
        setCustomer(res.customer);
        setIsAuthLoading(false);
        setIsAuthOpen(false);
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Сетевая ошибка при входе';
        setAuthError(message);
        return false;
      }
    },
    [deviceId]
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      confirm_password: string;
      firstname?: string;
      lastname?: string;
    }) => {
      setAuthError(null);
      try {
        const res = await registerMobileCustomer({
          email: payload.email.trim(),
          password: payload.password,
          confirm_password: payload.confirm_password,
          deviceId,
        });
        if (!res.ok || !res.customer || !res.token) {
          setAuthError(res.error || 'Ошибка регистрации');
          return false;
        }
        await saveAuthToken(res.token);
        setToken(res.token);
        setCustomer(res.customer);
        setIsAuthLoading(false);
        setIsAuthOpen(false);
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Сетевая ошибка при регистрации';
        setAuthError(message);
        return false;
      }
    },
    [deviceId]
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutMobileCustomer(token);
      }
    } catch {
      // Игнорируем сетевые ошибки при выходе
    } finally {
      await removeAuthToken();
      setToken('');
      setCustomer(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        customer,
        isLoggedIn: !!customer,
        isAuthLoading,
        authError,
        isAuthOpen,
        openAuth,
        closeAuth,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
