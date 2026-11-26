import { api } from "../../infrastructure/api";
import { setAuthData, clearAllAuthData, removeAuthToken } from "../../infrastructure/storage";
import type {
  LoginCredentials,
  LoginResponse,
  VerifyTokenResponse,
  UserRole,
} from "../../domain/types";

export const authService = {
  /** The server answers with an httpOnly session cookie; the page only keeps role and userId. */
  async login(credentials: LoginCredentials): Promise<{ userId: string; role: UserRole }> {
    const response = await api.post<LoginResponse>("/login", credentials);
    const userId = response.data?.data?.userId;
    if (!userId) throw new Error("No userId in response");
    const role: UserRole = response.data.data.role === "admin" ? "admin" : "learner";
    setAuthData(role, userId);
    return { userId, role };
  },

  /** Checks the session cookie. An old stored token rides along once and is moved into the cookie. */
  async verifyToken(): Promise<{ role: string; userId: string }> {
    const response = await api.get<VerifyTokenResponse>("/api/verify-token");

    if (response.data.success === true) {
      removeAuthToken();
      return {
        role: response.data.data.role,
        userId: response.data.data.userId,
      };
    }

    throw new Error("Token verification failed");
  },

  logout(): void {
    clearAllAuthData();
    api.post("/logout").catch(() => undefined);
  },
};

export default authService;
