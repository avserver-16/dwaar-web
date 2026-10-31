import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds fresh
      gcTime: 1000 * 60 * 10, // 10 minutes cache retention
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Do not retry on 401, 403, or 404
        const msg = error?.message || '';
        if (msg.includes('401') || msg.includes('403') || msg.includes('404')) return false;
        return failureCount < 2;
      },
    },
  },
});
