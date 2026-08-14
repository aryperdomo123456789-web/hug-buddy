import { createAPIFileRoute } from '@tanstack/react-start/api'
import { getInstallScript } from '@/lib/server.functions'

export const Route = createAPIFileRoute('/api/public/install')({
  GET: async () => {
    const script = await getInstallScript();
    return new Response(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  },
})
