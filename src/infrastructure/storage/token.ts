import Cookies from "js-cookie";

const AUTH_TOKEN_KEY = "authToken";
const USER_ROLE_KEY = "userRole";
const USER_ID_KEY = "userId";

export const getAuthToken = (): string | undefined => {
  const fromLocalStorage = localStorage.getItem(AUTH_TOKEN_KEY);
  if (fromLocalStorage) return fromLocalStorage;
  return Cookies.get(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  Cookies.set(AUTH_TOKEN_KEY, token, { sameSite: "Lax" });
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  Cookies.remove(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getUserRole = (): string | undefined => {
  return (Cookies.get(USER_ROLE_KEY) ?? localStorage.getItem(USER_ROLE_KEY)) ?? undefined;
};

export const setUserRole = (role: string): void => {
  Cookies.set(USER_ROLE_KEY, role, { sameSite: "Lax" });
  localStorage.setItem(USER_ROLE_KEY, role);
};

export const removeUserRole = (): void => {
  Cookies.remove(USER_ROLE_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
};

export const getUserId = (): string | undefined => {
  return (Cookies.get(USER_ID_KEY) ?? localStorage.getItem(USER_ID_KEY)) ?? undefined;
};

export const setUserId = (userId: string): void => {
  Cookies.set(USER_ID_KEY, userId, { sameSite: "Lax" });
  localStorage.setItem(USER_ID_KEY, userId);
};

export const removeUserId = (): void => {
  Cookies.remove(USER_ID_KEY);
  localStorage.removeItem(USER_ID_KEY);
};

export const clearAllAuthData = (): void => {
  removeAuthToken();
  removeUserRole();
  removeUserId();
};

export const setAuthData = (
  token: string,
  role: string,
  userId: string,
  options?: { secure?: boolean }
): void => {
  const isProduction = options?.secure ?? import.meta.env.MODE === "production";
  const cookieOptions = { sameSite: isProduction ? "None" : "Lax", secure: isProduction } as const;

  Cookies.set(AUTH_TOKEN_KEY, token, cookieOptions);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  Cookies.set(USER_ROLE_KEY, role, cookieOptions);
  localStorage.setItem(USER_ROLE_KEY, role);
  Cookies.set(USER_ID_KEY, userId, cookieOptions);
  localStorage.setItem(USER_ID_KEY, userId);
};
