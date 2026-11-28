import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const auth = { isAuthenticated: true, userRole: "learner", mustChangePassword: true, passwordChanged: vi.fn() };
vi.mock("../AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/application/services/authService", () => ({ authService: { changePassword: vi.fn() } }));

describe("ProtectedRoute", () => {
  it("asks for a new password before showing the app", () => {
    render(<MemoryRouter><ProtectedRoute allowedRoles={["learner"]}><p>the app</p></ProtectedRoute></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "ตั้งรหัสผ่านใหม่" })).toBeInTheDocument();
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
  });

  it("shows the app when no change is needed", () => {
    auth.mustChangePassword = false;
    render(<MemoryRouter><ProtectedRoute allowedRoles={["learner"]}><p>the app</p></ProtectedRoute></MemoryRouter>);
    expect(screen.getByText("the app")).toBeInTheDocument();
  });
});
