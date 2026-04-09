import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { RoleGuard } from '../components/RoleGuard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

// Mock компоненты
const AdminPage = () => <div>Admin Page</div>;
const ManagerPage = () => <div>Manager Page</div>;
const ForbiddenPage = () => <div>Access Denied</div>;
const LoginPage = () => <div>Login Page</div>;

// Mock useAuth
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'ADMIN' as const,
  department: 'IT',
  departmentId: 1,
};

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      currentUser: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      allUsers: [],
      setAllUsers: vi.fn(),
    }),
  };
});

vi.mock('../services/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children for allowed role', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminPage />
            </RoleGuard>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });
  });

  it('should render fallback for disallowed role', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <RoleGuard allowedRoles={['MANAGER']} fallback={<ForbiddenPage />}>
              <AdminPage />
            </RoleGuard>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  it('should allow multiple roles', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
              <AdminPage />
            </RoleGuard>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });
  });
});
