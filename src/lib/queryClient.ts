import { QueryCache, QueryClient } from "react-query";
import { toast } from "react-toastify";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      if (query.state.data === undefined) toast.error("Couldn't load this page's data. Check your connection and try again.", { toastId: "query-error" });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
