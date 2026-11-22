import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useCohort } from "./useCohort";

vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { cohort_number: 13 } }) }));

function Switcher() {
  const [, set] = useCohort();
  return <button onClick={() => set(14)}>switch</button>;
}
function Page() {
  const [c] = useCohort();
  return <p>page JSD{c}</p>;
}

describe("useCohort", () => {
  it("switching in one place updates every page", () => {
    render(
      <>
        <Switcher />
        <Page />
      </>
    );
    fireEvent.click(screen.getByText("switch"));
    expect(screen.getByText("page JSD14")).toBeInTheDocument();
  });
});
