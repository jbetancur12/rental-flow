import { useAppStore } from '../store/useAppStore';

export function useApp() {
  return useAppStore();
}