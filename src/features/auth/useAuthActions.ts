import { useNavigate } from "react-router-dom";
import { useAuth } from "../../application/contexts/AuthContext";
import { useUserData } from "../../application/contexts/UserDataContext";
import { getHomeRoute } from "../../routes/getHomeRoute";

export function useAuthActions() {
  const { isAuthenticated, userRole, login } = useAuth();
  const { refetchUserData } = useUserData();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      const role = await login(email, password);
      await refetchUserData();
      navigate(getHomeRoute(true, role));
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const homeRoute = getHomeRoute(isAuthenticated, userRole);

  return { handleLogin, homeRoute };
}

