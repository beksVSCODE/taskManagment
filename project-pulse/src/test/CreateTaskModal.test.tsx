import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { AuthProvider } from '../contexts/AuthContext';
import { Project } from '../types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

// Mock project
const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  status: 'ACTIVE',
  department: 'IT',
  departmentId: 1,
  pmId: '1',
  pmName: 'PM Name',
  startDate: '2024-01-01',
  dueDate: '2024-12-31',
  progress: 50,
  createdAt: '2024-01-01',
};

// Mock useAuth
const mockCurrentUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'ADMIN' as const,
  department: 'IT',
  departmentId: 1,
};

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    currentUser: mockCurrentUser,
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    allUsers: [],
    setAllUsers: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('../hooks/useData', () => ({
  useUsers: () => ({
    data: [
      { id: '1', fullName: 'User 1', email: 'user1@test.com', department: 'IT' },
      { id: '2', fullName: 'User 2', email: 'user2@test.com', department: 'IT' },
    ],
    isLoading: false,
  }),
  useCreateTask: () => ({
    mutate: vi.fn((data, options) => {
      // Simulate success
      if (options?.onSuccess) {
        options.onSuccess({ id: '100', ...data });
      }
    }),
    isLoading: false,
  }),
  useAddSubtask: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('CreateTaskModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={true} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Создать задачу')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={false} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.queryByText('Создать задачу')).not.toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={true} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Find and click submit button (might be labeled "Создать" or similar)
    const submitButton = screen.getByRole('button', { name: /создать|сохранить/i });
    fireEvent.click(submitButton);

    // Wait for validation errors
    await waitFor(() => {
      // Should show error for required title field
      expect(screen.getByText(/название обязательно/i)).toBeInTheDocument();
    });
  });

  it('should require title field', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={true} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    const submitButton = screen.getByRole('button', { name: /создать|сохранить/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/название обязательно/i)).toBeInTheDocument();
    });
  });

  it('should have title input field', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={true} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Should have title input
    const titleInput = screen.getByPlaceholderText(/название задачи/i) || 
                      screen.getByLabelText(/название/i);
    expect(titleInput).toBeInTheDocument();
  });

  it('should have description textarea', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={true} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Should have description field
    const descriptionField = screen.getByPlaceholderText(/описание/i) || 
                            screen.getByLabelText(/описание/i);
    expect(descriptionField).toBeInTheDocument();
  });

  it('should have priority selector', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={true} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Should have priority selector (may be a select or buttons)
    expect(screen.getByText(/приоритет/i)).toBeInTheDocument();
  });

  it('should close modal when cancel button clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreateTaskModal open={true} onClose={mockOnClose} project={mockProject} />
        </AuthProvider>
      </QueryClientProvider>
    );

    const cancelButton = screen.getByRole('button', { name: /отмена/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
