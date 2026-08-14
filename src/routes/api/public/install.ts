import { createAPIFileRoute } from '@tanstack/react-start/api';
import { getInstallScript } from '@/lib/server.functions';

export const GET = createAPIFileRoute('/api/public/install')({
  handler: async () => {
    const script = await getInstallScript();
    
    return new Response(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache',
      },
    });
  },
});
