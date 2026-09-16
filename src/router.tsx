import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn, getGlobalStartContext } from "@tanstack/react-start";
import { routeTree } from "./routeTree.gen";

const getCspNonce = createIsomorphicFn()
  .server(() => {
    const context = getGlobalStartContext();
    return typeof context?.cspNonce === "string" ? context.cspNonce : undefined;
  })
  .client(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]');
    return meta?.content;
  });

export const getRouter = () => {
  const queryClient = new QueryClient();
  const nonce = getCspNonce();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ssr: nonce ? { nonce } : undefined,
  });

  return router;
};
