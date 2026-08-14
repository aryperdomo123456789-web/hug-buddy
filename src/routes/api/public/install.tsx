import { createFileRoute } from '@tanstack/react-router'
import { getInstallScript } from '@/lib/server.functions'

export const Route = createFileRoute('/api/install')({
  server: {
    handlers: {
      GET: async () => {
        const script = await getInstallScript()
        return new Response(script, {
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
    }
  }
})
