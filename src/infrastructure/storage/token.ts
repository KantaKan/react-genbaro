import Cookies from "js-cookie";

const AUTH_TOKEN_KEY = "authToken";
const USER_ROLE_KEY = "userRole";
const USER_ID_KEY = "userId";

/** A token from before the httpOnly cookie. Only used once, to move that session into the cookie. */
export const getAuthToken = (): string | undefined => {
  const fromLocalStorage = localStorage.getItem(AUTH_TOKEN_KEY);
  if (fromLocalStorage) return fromLocalStorage;
  return Cookies.get(AUTH_TOKEN_KEY);
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

/** Remembers who is signed in (not the token: that stays in the httpOnly cookie). */
export const setAuthData = (role: string, userId: string): void => {
  removeAuthToken();
  localStorage.setItem(USER_ROLE_KEY, role);
  localStorage.setItem(USER_ID_KEY, userId);
};
