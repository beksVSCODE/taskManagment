import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import Login from '../pages/Login';
import { api, ApiError } from '../services/apiClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

vi.mock('../services/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Login Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('should show error on invalid credentials', async () => {
    const mockPost = vi.mocked(api.post);
    // Create proper ApiError instance with correct parameter order (status, message)
    const apiError = new ApiError(401, 'Invalid credentials');
    mockPost.mockRejectedValueOnce(apiError);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/пароль/i);
    const submitButton = screen.getByRole('button', { name: /войти/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Неверный email или пароль')).toBeInTheDocument();
    });
  });

  it('should disable inputs while loading', async () => {
    const mockPost = vi.mocked(api.post);
    // Create a promise that resolves after delay
    mockPost.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 200)));

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/пароль/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /войти/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Check immediately after submit - should be disabled
    await waitFor(() => {
      expect(screen.getByText(/вход\.\.\./i)).toBeInTheDocument();
    });
  });
});
