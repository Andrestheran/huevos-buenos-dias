import { ReactNode } from 'react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useSyncStore } from '@/shared/stores/syncStore';
import { Button, Badge } from '@/shared/components';
import { authService } from '@/features/auth/services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatRelativeTime } from '@/shared/utils';

interface WorkerLayoutProps {
  children: ReactNode;
}

export function WorkerLayout({ children }: WorkerLayoutProps) {
  const { profile } = useAuthStore();
  const { isOnline, pendingCount, lastSyncAt, isSyncing } = useSyncStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          ⚠️ Sin conexión - Los registros se guardarán automáticamente
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm safe-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Buenos Días Huevos</h1>
              <p className="text-sm text-neutral-600">{profile?.full_name}</p>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>

      {/* Sync Status Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 safe-bottom">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <span className="text-success">●</span>
                  <span className="text-neutral-700">Conectado</span>
                </>
              ) : (
                <>
                  <span className="text-danger">●</span>
                  <span className="text-neutral-700">Sin conexión</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <Badge variant="warning" size="sm">
                  {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                </Badge>
              )}

              {isSyncing && (
                <span className="text-primary syncing">Sincronizando...</span>
              )}

              {lastSyncAt && !isSyncing && (
                <span className="text-neutral-500 text-xs">
                  Última sincronización: {formatRelativeTime(lastSyncAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
