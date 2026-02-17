import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import { Loading } from '@/shared/components';

interface AuthGuardProps {
  children: ReactNode;
  requireRole?: 'admin' | 'worker';
}

/**
 * Protected route component
 *
 * - Redirects to login if not authenticated
 * - Redirects to home if role doesn't match
 * - Shows loading state during auth check
 */
export function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const { isAuthenticated, profile, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <Loading fullScreen text="Verificando sesión..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no profile exists, show error (user exists in auth but not in profiles table)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Error de Configuración
          </h2>
          <p className="text-neutral-600 mb-4">
            Tu cuenta no está completamente configurada. Por favor contacta al administrador.
          </p>
          <p className="text-sm text-neutral-500 mb-4">
            Código de error: PROFILE_NOT_FOUND
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  // Check role if specified
  if (requireRole && profile.role !== requireRole) {
    // Redirect admin to admin dashboard, worker to production
    const redirectTo = profile.role === 'admin' ? '/admin' : '/production';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
