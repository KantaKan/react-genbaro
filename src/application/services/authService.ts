import { api } from "../../infrastructure/api";
import { setAuthData, clearAllAuthData } from "../../infrastructure/storage";
import type {
  LoginCredentials,
  RegisterData,
  LoginResponse,
  VerifyTokenResponse,
  UserRole,
} from "../../domain/types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ token: string; userId: string; role: UserRole }> {
    const response = await api.post<LoginResponse>("/login", credentials);

    if (response.data?.data?.token) {
      const rawRole = response.data.data.role || "learner";
      const role: UserRole = rawRole === "admin" ? "admin" : "learner";
      const token = response.data.data.token;
      const userId = response.data.data.userId;

      setAuthData(token, role, userId);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { token, userId, role };
    }

    throw new Error("No token or userId in response");
  },

  async register(userData: RegisterData) {
    const response = await api.post("/register", userData);
    return response.data;
  },

  async verifyToken(token: string): Promise<{ role: string; userId: string }> {
    const response = await api.get<VerifyTokenResponse>("/api/verify-token", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success === true) {
      return {
        role: response.data.data.role,
        userId: response.data.data.userId,
      };
    }

    throw new Error("Token verification failed");
  },

  logout(): void {
    clearAllAuthData();
    delete api.defaults.headers.common["Authorization"];
  },
};

export default authService;
