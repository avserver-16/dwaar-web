import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  push: (text, kind = 'ok') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, text, kind }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Helper function to push toast outside React component render cycle
export const toast = (text, kind = 'ok') => useToastStore.getState().push(text, kind);
