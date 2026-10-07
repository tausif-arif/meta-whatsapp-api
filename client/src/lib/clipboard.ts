import { toast } from '@/stores/toastStore';

export const copyText = async (text: string, label = 'Copied'): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error('Copy failed', 'Clipboard is not available');
  }
};