import { createFileRoute } from '@tanstack/react-router'
import { getInstallScript } from '@/lib/server.functions'

export const Route = createFileRoute('/api/public/install')({
  server: {
    handlers: {
      GET: async () => {
        const script = await getInstallScript()
        return new Response(script, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      }
    }
  }
})
