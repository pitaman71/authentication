// react-js/src/auth.provider.tsx
import { jwtDecode } from 'jwt-decode';
import { createContext, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string|null;
  loginWithGoogle: () => void;
  loginWithApple: () => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface DecodedToken {
  sub: string;
  email: string;
  name?: string;
  exp: number;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useLocalStorage<string | null>('accessToken', null);
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('refreshToken', null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (accessToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
        if ((decoded.exp * 1000) - REFRESH_BUFFER < Date.now()) {
          refreshAccessToken();
        } else {
          setUser({
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name
          });
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
  }, [accessToken]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    
    if (accessToken && refreshToken) {
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google/authorize`;
  };

  const loginWithApple = () => {
    window.location.href = `${API_URL}/auth/apple/authorize`;
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) return;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) throw new Error('Failed to refresh token');

      const data: TokenResponse = await response.json();
      setAccessToken(data.accessToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loginWithGoogle,
      loginWithApple,
      logout,
      refreshAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};