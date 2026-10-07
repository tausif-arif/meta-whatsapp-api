import { create } from 'zustand';

export type ToastKind = 'success' | 'error';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, title: string, description?: string) => void;
  remove: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, title, description) =>
    set((state) => ({
      toasts: [...state.toasts, { id: ++nextId, kind, title, description }],
    })),
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push('success', title, description),
  error: (title: string, description?: string) =>
    useToastStore.getState().push('error', title, description),
};