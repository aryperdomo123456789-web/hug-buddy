import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({
  serverFunctions: {
    basePath: "/_server",
  },
}));


