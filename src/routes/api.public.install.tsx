import { createFileRoute } from '@tanstack/react-router';
import { getInstallScript } from '@/lib/server.functions';

export const Route = createFileRoute('/api/public/install')({
  loader: async () => {
    // Usamos literal para evitar middleware no loader público que 401s
    const script = `bash <(curl -sSL https://id-preview--71a12a47-d6b3-4362-a2b3-4497a0a13af3.lovable.app/api/install)`;
    
    return new Response(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache',
      },
    });
  },
  component: () => null,
});
