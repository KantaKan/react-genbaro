import "./App.css";
import { useState, useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { WeeklyReflections } from "./components/WeeklyReflections";
import { AllUsers } from "./components/AllUsers";
import { UsersByBarometer } from "./components/UsersByBarometer";
import { Login } from "./components/auth/login";
import Page from "./app/dashboard/page";
import { SignUp } from "./components/auth/signup";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("authToken"));
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check authentication state on app load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // Verify token with the backend to ensure it's valid
      axios
        .get("/api/verify-token", { headers: { Authorization: `Bearer ${token}` } })
        .then(() => setIsAuthenticated(true))
        .catch(() => {
          localStorage.removeItem("authToken");
          setIsAuthenticated(false);
        });
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch("http://127.0.0.1:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      console.log("Login response data:", data); // Log the response to check the structure

      if (data && data.data && data.data.token) {
        // Accessing the token correctly
        localStorage.setItem("authToken", data.data.token); // Save token
        setIsAuthenticated(true); // Set auth state
        navigate("/dashboard"); // Redirect to dashboard after login
      } else {
        throw new Error("No token in response");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    navigate("/login"); // Redirect to login page after logout
  };

  // ProtectedRoute component to guard routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  // Handle SignUp logic
  const handleSignUp = async (first_name: string, last_name: string, email: string, password: string, cohort_number: number) => {
    try {
      const response = await axios.post("http://127.0.0.1:3000/register", {
        first_name,
        last_name,
        email,
        password,
        cohort_number,
      });

      if (response.status === 201 && response.data.token) {
        // If registration is successful and we get a token, store it
        localStorage.setItem("authToken", response.data.token);
        setIsAuthenticated(true);
        setError(null);
        navigate("/dashboard"); // Redirect to dashboard after successful sign-up
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      // Handle errors such as validation errors or server issues
      setError(err.response?.data?.message || "Sign-up failed. Please try again.");
    }
  };

  // Conditional rendering based on authentication state
  if (!isAuthenticated) {
    return (
      <div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Routes>
          <Route path="/" element={<Login onLogin={handleLogin} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignUp onSignUp={handleSignUp} />} />
        </Routes>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Page>
          <button onClick={handleLogout} className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
          <Routes>
            <Route path="/signup" element={<SignUp onSignUp={handleSignUp} />} />
            {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WeeklyReflections />
                    <AllUsers />
                    <UsersByBarometer />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Page>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
