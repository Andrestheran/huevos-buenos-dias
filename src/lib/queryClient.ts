import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 *
 * Optimized for:
 * - Offline-first behavior
 * - Automatic retries with exponential backoff
 * - Reasonable stale time for production data
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,

      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (for real-time updates)
      refetchOnWindowFocus: true,

      // Don't refetch on reconnect (let service worker handle it)
      refetchOnReconnect: false,

      // Show cached data while refetching
      refetchOnMount: 'always'
    },
    mutations: {
      // Retry mutations once (for transient network errors)
      retry: 1,
      retryDelay: 1000
    }
  }
});
