import { useEffect, useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { queryClient } from './lib/queryClient';
import { useAuthStore } from './shared/stores/authStore';
import { authService } from './features/auth/services/authService';
import { supabase } from './lib/supabase';

// Pages
import { LoginForm } from './features/auth/components/LoginForm';
import { AuthGuard } from './features/auth/components/AuthGuard';
import { WorkerPage } from './pages/WorkerPage';
import { AdminPage } from './pages/AdminPage';
import { Loading } from './shared/components';

function App() {
  const [appLoading, setAppLoading] = useState(true);
  const { setUser, setProfile, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log('🔐 Initializing auth...');
        const session = await authService.getSession();

        if (!mounted) return;

        if (session?.user) {
          console.log('✅ Session found:', session.user.email);
          setUser(session.user);
          const profile = await authService.getProfile(session.user.id);
          console.log('✅ Profile loaded:', profile);
          setProfile(profile);
        } else {
          console.log('⚠️ No session found');
          logout();
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          logout();
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete');
          setAppLoading(false);
        }
      }
    }

    // Initialize auth
    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const profile = await authService.getProfile(session.user.id);
        setProfile(profile);
      } else {
        logout();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only run once on mount

  if (appLoading) {
    return <Loading fullScreen text="Cargando aplicación..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />

          {/* Protected routes */}
          <Route
            path="/production"
            element={
              <AuthGuard requireRole="worker">
                <WorkerPage />
              </AuthGuard>
            }
          />

          <Route
            path="/admin"
            element={
              <AuthGuard requireRole="admin">
                <AdminPage />
              </AuthGuard>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* React Query Devtools (only in development) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
