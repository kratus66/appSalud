import { toast } from 'sonner';

export function handleApiError(error: unknown, defaultMessage = 'Error en la operación'): string {
  const message = error?.response?.data?.message 
    || error?.message 
    || defaultMessage;
  
  toast.error(message);
  console.error('API Error:', error);
  return message;
}

export function handleApiSuccess(message: string) {
  toast.success(message);
}
