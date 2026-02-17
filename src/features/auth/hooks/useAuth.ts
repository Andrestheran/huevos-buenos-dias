import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/shared/stores/authStore';
import { authService } from '../services/authService';

/**
 * Main authentication hook
 *
 * Handles:
 * - Session initialization
 * - Auth state changes
 * - Automatic profile fetching
 */
export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize session
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (session?.user) {
        setUser(session.user);
        const profile = await authService.getProfile(session.user.id);
        setProfile(profile);
      } else {
        logout();
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function initializeAuth() {
    try {
      setLoading(true);
      const session = await authService.getSession();

      if (session?.user) {
        setUser(session.user);
        const profile = await authService.getProfile(session.user.id);
        setProfile(profile);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    const { user, profile } = await authService.login({ email, password });
    setUser(user);
    setProfile(profile);

    // Redirect based on role
    if (profile?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/production');
    }
  }

  async function handleLogout() {
    await authService.logout();
    logout();
    navigate('/login');
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isWorker: profile?.role === 'worker',
    login: handleLogin,
    logout: handleLogout
  };
}
