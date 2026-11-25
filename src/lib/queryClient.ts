import { QueryCache, QueryClient } from "react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      if (query.state.data === undefined) toast.error("Couldn't load this page's data. Check your connection and try again.", { id: "query-error" });
    },
  }),
  defaultOptions: {
    queries: {
      // Reuse data for 30s when moving between pages; live screens (check-in) opt out with staleTime: 0.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
