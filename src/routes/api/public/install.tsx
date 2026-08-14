import { createFileRoute } from '@tanstack/react-router';
import { getInstallScript } from '@/lib/server.functions';

export const Route = createFileRoute('/api/public/install')({
  loader: async () => {
    const script = await getInstallScript();
    
    // TanStack Start v1: Loaders em rotas de API devem retornar Response para bypassar o shell HTML
    return new Response(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache',
      },
    });
  },
});
