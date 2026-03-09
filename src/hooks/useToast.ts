import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';

/**
 * Unified toast hook — delegates to sonner.
 * Keeps the same API so existing callers don't break:
 *   toast('Title', { description, type })
 *   toast.success / .error / .warning / .info
 */
export function useToast() {
  const toast = useCallback(
    (title: string, options?: { description?: string; type?: string; duration?: number }) => {
      const msg = options?.description ? `${title}: ${options.description}` : title;
      const duration = options?.duration;

      switch (options?.type) {
        case 'success':
          sonnerToast.success(title, { description: options.description, duration });
          break;
        case 'error':
          sonnerToast.error(title, { description: options.description, duration });
          break;
        case 'warning':
          sonnerToast.warning(title, { description: options.description, duration });
          break;
        default:
          sonnerToast.info(title, { description: options.description, duration });
          break;
      }
    },
    []
  );

  const success = useCallback(
    (title: string, description?: string) => sonnerToast.success(title, { description }),
    []
  );

  const error = useCallback(
    (title: string, description?: string) => sonnerToast.error(title, { description }),
    []
  );

  const warning = useCallback(
    (title: string, description?: string) => sonnerToast.warning(title, { description }),
    []
  );

  const info = useCallback(
    (title: string, description?: string) => sonnerToast.info(title, { description }),
    []
  );

  const dismiss = useCallback(
    (id?: string | number) => sonnerToast.dismiss(id),
    []
  );

  return { toast, success, error, warning, info, dismiss };
}
