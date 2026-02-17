import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useUserData } from "../../UserDataContext";
import { api } from "../../lib/api";
import { getHomeRoute } from "../../routes/getHomeRoute";

type SignUpArgs = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  cohort_number: number;
  jsd_number: string;
  project_group: string;
  genmate_group: string;
  zoom_name: string;
};

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

  const handleSignUp = async (args: SignUpArgs) => {
    try {
      const response = await api.post("register", args);
      if (response.data.token) {
        navigate("/login");
        return;
      }
      throw new Error("Invalid response from server");
    } catch (err: unknown) {
      console.error("Sign-up error:", err);
    }
  };

  const homeRoute = getHomeRoute(isAuthenticated, userRole);

  return { handleLogin, handleSignUp, homeRoute };
}

