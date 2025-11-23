import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types/api';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('authTokens');
        const storedUser = localStorage.getItem('authUser');

        if (storedTokens && storedUser) {
          const parsedTokens: AuthTokens = JSON.parse(storedTokens);
          const parsedUser: User = JSON.parse(storedUser);

          // Set tokens in API client
          apiClient.setAuthToken(parsedTokens.accessToken);
          apiClient.setAuthInitialized(true);

          // Verify token is still valid by fetching profile
          try {
            await apiClient.getProfile();
            setUser(parsedUser);
            setTokens(parsedTokens);
          } catch (error) {
            // Token is invalid, clear stored data
            localStorage.removeItem('authTokens');
            localStorage.removeItem('authUser');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set auth token in API client
  const setAuthToken = (token: string | null) => {
    if (token) {
      apiClient.setAuthToken(token);
    } else {
      apiClient.clearAuthToken();
    }
  };

  // Store auth data
  const storeAuthData = (user: User, tokens: AuthTokens) => {
    setUser(user);
    setTokens(tokens);
    setAuthToken(tokens.accessToken);
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    localStorage.setItem('authUser', JSON.stringify(user));
  };

  // Clear auth data
  const clearAuthData = () => {
    setUser(null);
    setTokens(null);
    setAuthToken(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('authUser');
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(credentials);
      storeAuthData(response.user, response.tokens);
      toast.success('Login successful!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
      apiClient.setAuthInitialized(true);
    }
  };


  // Logout function
  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuthData();
      toast.success('Logged out successfully');
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.refreshToken(tokens.refreshToken);
      const newTokens = {
        ...tokens,
        accessToken: response.accessToken
      };
      setTokens(newTokens);
      setAuthToken(response.accessToken);
      localStorage.setItem('authTokens', JSON.stringify(newTokens));
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      throw error;
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      toast.error(message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};