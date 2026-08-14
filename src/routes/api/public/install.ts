import { createServerFn } from "@tanstack/react-start";
import { getInstallScript } from '@/lib/server.functions';

export const Route = {
  GET: async ({ request }: { request: Request }) => {
    const script = await getInstallScript();
    
    // Forçar a resposta a ser puramente texto e sem cache
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
};
