import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from '../stores/useToastStore';

export function useUploadMutation() {
  return useMutation({
    mutationFn: (file) => api.upload(file),
    onError: (err) => {
      toast(err.message, 'err');
    },
  });
}
