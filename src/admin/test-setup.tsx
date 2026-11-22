import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AdminShell } from "./shell/AdminShell";

/** Renders a page inside the admin shell (callers mock auth, user data, sonner, blobatar). */
export function renderAdmin(ui: ReactNode, path = "/admin", route = "*") {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <AdminShell>
          <Routes>
            <Route path={route} element={ui} />
            <Route path="*" element={<p>other page</p>} />
          </Routes>
        </AdminShell>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
