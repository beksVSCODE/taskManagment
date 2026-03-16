import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthUser, LoginRequest, JwtResponse } from '@/types';
import { api } from '@/services/apiClient';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  // для совместимости с компонентами, использующими allUsers
  allUsers: User[];
  setAllUsers: (users: User[]) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapAuthUserToUser(auth: AuthUser): User {
  return {
    id: String(auth.id),
    name: auth.fullName,
    email: auth.email,
    role: auth.role,
    department: auth.departmentName || '',
    departmentId: auth.departmentId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Восстановление сессии при загрузке
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.get<AuthUser>('/auth/me')
      .then(me => {
        setCurrentUser(mapAuthUserToUser(me));
      })
      .catch(() => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('current_user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Обработка принудительного logout (401)
  useEffect(() => {
    const handler = () => {
      setCurrentUser(null);
      setAllUsers([]);
      queryClient.clear();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [queryClient]);

  const login = async (data: LoginRequest) => {
    const response = await api.post<JwtResponse>('/auth/login', data);
    localStorage.setItem('jwt_token', response.token);

    // Очищаем кэш предыдущего пользователя перед загрузкой данных нового
    queryClient.clear();

    const me = await api.get<AuthUser>('/auth/me');
    const user = mapAuthUserToUser(me);
    setCurrentUser(user);
    localStorage.setItem('current_user', JSON.stringify(user));
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    setCurrentUser(null);
    setAllUsers([]);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: !!currentUser,
        login,
        logout,
        allUsers,
        setAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
