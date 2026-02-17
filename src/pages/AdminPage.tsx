import { Dashboard } from '@/features/admin/components/Dashboard';
import { Button } from '@/shared/components';
import { authService } from '@/features/auth/services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import { toast } from 'react-toastify';

export function AdminPage() {
  const { profile } = useAuthStore();
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">🥚 Buenos Días Huevos</h1>
              <p className="text-sm text-neutral-600">{profile?.full_name} - Administrador</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Dashboard />
      </main>
    </div>
  );
}
