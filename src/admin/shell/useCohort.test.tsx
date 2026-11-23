import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import type { ReactNode } from "react";

const me = vi.hoisted(() => ({ cohort_number: 13 }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: me }) }));
vi.mock("../api", () => ({ adminApi: { cohorts: async () => [{ cohort: 8 }, { cohort: 11 }, { cohort: 9 }] } }));

const { useCohort } = await import("./useCohort");

const wrap = (ui: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

function Switcher() {
  const [, set] = useCohort();
  return <button onClick={() => set(14)}>switch</button>;
}
function Page() {
  const [c] = useCohort();
  return <p>page JSD{c}</p>;
}

describe("useCohort", () => {
  it("staff with no cohort of their own start on the newest cohort, not JSD0", async () => {
    me.cohort_number = 0;
    wrap(<Page />);
    expect(await screen.findByText("page JSD11")).toBeInTheDocument();
  });

  it("switching in one place updates every page", () => {
    me.cohort_number = 13;
    wrap(
      <>
        <Switcher />
        <Page />
      </>
    );
    fireEvent.click(screen.getByText("switch"));
    expect(screen.getByText("page JSD14")).toBeInTheDocument();
  });
});
