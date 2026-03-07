import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { pushToast, dismissToast } from '../store/slices/uiSlice';
import type { NotificationType } from '../types';

export function useToast() {
  const dispatch = useAppDispatch();

  const toast = useCallback(
    (title: string, options?: { description?: string; type?: NotificationType; duration?: number }) => {
      dispatch(pushToast({
        title,
        description: options?.description,
        type: options?.type ?? 'info',
        duration: options?.duration ?? 4000,
      }));
    },
    [dispatch]
  );

  const success = useCallback(
    (title: string, description?: string) => toast(title, { type: 'success', description }),
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => toast(title, { type: 'error', description }),
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => toast(title, { type: 'warning', description }),
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => toast(title, { type: 'info', description }),
    [toast]
  );

  const dismiss = useCallback(
    (id: string) => dispatch(dismissToast(id)),
    [dispatch]
  );

  return { toast, success, error, warning, info, dismiss };
}
