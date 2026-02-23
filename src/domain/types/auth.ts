export const USER_ROLES = ["admin", "learner"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export interface AuthTokens {
  token: string;
  userId: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  cohort_number: string;
  jsd_number: string;
  project_group?: string;
  genmate_group?: string;
  zoom_name?: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  data: {
    role: string;
    userId: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    userId: string;
    role: UserRole;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userId: string | null;
  error: string | null;
  loading: boolean;
}
