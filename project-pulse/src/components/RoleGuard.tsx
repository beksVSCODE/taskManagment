import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Role } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

/**
 * Role-based access control guard
 * Показывает children только если роль пользователя в allowedRoles
 */
export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = ((currentUser.role as unknown as string) ?? '').toUpperCase();
  const normalizedRole = userRole.startsWith('ROLE_') ? userRole.slice(5) : userRole;

  const hasAccess = allowedRoles.some(role => role.toUpperCase() === normalizedRole);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * HOC для защиты маршрутов по ролям
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Role[]
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}
