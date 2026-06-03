import { createContext, createRequestHandler, RouterContextProvider } from "react-router";

// This app runs with React Router's v8 middleware flag on
// (`react-router.config.ts`), so `createRequestHandler` expects a
// `RouterContextProvider` rather than a plain `AppLoadContext` object. We
// expose the Cloudflare bindings through a typed context key; routes/middleware
// can read them with `context.get(cloudflareContext)`.
export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env, ctx });
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
