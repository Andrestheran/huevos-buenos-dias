import { useState, FormEvent } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/shared/components';
import { validateEmail, validatePassword } from '@/shared/utils';
import { authService } from '../services/authService';
import { useAuthStore } from '@/shared/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const { setUser, setProfile, setLoading } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setErrors({
        email: emailValidation.error || '',
        password: passwordValidation.error || ''
      });
      return;
    }

    // Clear errors
    setErrors({ email: '', password: '' });

    try {
      setIsLoading(true);

      const { user, profile } = await authService.login({ email, password });

      setUser(user);
      setProfile(profile);
      setLoading(false); // Important: update loading state

      toast.success(`Bienvenido ${profile?.full_name || 'Usuario'}!`);

      // Redirect based on role
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/production');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Reset loading state on error
      setLoading(false);

      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Correo o contraseña incorrectos');
      } else {
        toast.error('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <Card className="w-full max-w-md" variant="elevated" padding="lg">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="text-6xl">🥚</div>
            <CardTitle className="text-2xl text-center">Buenos Días Huevos</CardTitle>
            <p className="text-sm text-neutral-600 text-center">
              Sistema de registro de producción
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              fullWidth
              autoComplete="email"
              autoFocus
            />

            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              fullWidth
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              size="touch"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Versión {import.meta.env.VITE_APP_VERSION || '1.0.0'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
