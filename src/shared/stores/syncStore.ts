import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncError: string | null;

  // Actions
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSyncAt: (date: Date) => void;
  setSyncError: (error: string | null) => void;
  incrementPending: () => void;
  decrementPending: () => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  syncError: null,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),
  setSyncError: (error) => set({ syncError: error }),

  incrementPending: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  decrementPending: () =>
    set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) }))
}));

// Listen to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}
