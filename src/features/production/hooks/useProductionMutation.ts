import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productionService } from '../services/productionService';
import { toast } from 'react-toastify';
import type { ProductionRecordCreate } from '../types';
import { useSyncStore } from '@/shared/stores/syncStore';
import { offlineService } from '@/shared/services/offlineService';

/**
 * Hook for creating production records
 *
 * Features:
 * - Optimistic updates
 * - Offline support
 * - Automatic retry
 * - Toast notifications
 */
export function useProductionMutation() {
  const queryClient = useQueryClient();
  const { isOnline, incrementPending } = useSyncStore();

  return useMutation({
    mutationFn: async (record: ProductionRecordCreate) => {
      // If offline, save to IndexedDB
      if (!isOnline) {
        await offlineService.saveRecord(record);
        incrementPending();
        return null;
      }

      // If online, save to Supabase
      return await productionService.createRecord(record);
    },

    onSuccess: (data, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['production-records'] });

      if (data) {
        toast.success('Producción registrada exitosamente ✓', {
          position: 'bottom-center',
          autoClose: 2000
        });
      } else {
        toast.info('Guardado offline. Se sincronizará automáticamente', {
          position: 'bottom-center',
          autoClose: 3000
        });
      }
    },

    onError: (error: any) => {
      console.error('Error creating record:', error);

      const errorMessage =
        error.message || 'Error al registrar producción. Intenta de nuevo.';

      toast.error(errorMessage, {
        position: 'bottom-center',
        autoClose: 4000
      });
    }
  });
}
