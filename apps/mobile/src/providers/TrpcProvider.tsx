import { useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import Constants from 'expo-constants';
import { useState } from 'react';
import superjson from 'superjson';
import { trpc } from '../shared/lib/trpc';

function getApiUrl() {
  if (Constants.expoConfig?.extra?.apiUrl)
    return Constants.expoConfig.extra.apiUrl as string;
  if (process.env.EXPO_PUBLIC_API_URL)
    return process.env.EXPO_PUBLIC_API_URL;
  // Derive host from Metro bundler so physical devices work without manual IP config.
  // manifest.debuggerHost is e.g. "192.168.1.5:8081"; strip the port for the API.
  const debuggerHost = (Constants.manifest as any)?.debuggerHost
    ?? Constants.expoConfig?.hostUri;
  const host = debuggerHost?.split(':')[0];
  if (host)
    return `http://${host}:3001`;
  return 'http://localhost:3001';
}

const API_URL = getApiUrl();

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
          transformer: superjson,
          async headers() {
            const token = await getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
