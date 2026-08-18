import { createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { installRuntimeErrorListeners } from "@/lib/runtime-error-listeners";

installRuntimeErrorListeners();

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  // TanStack Start v1 options
}));
