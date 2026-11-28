import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import type { UserRole } from "../types/auth";
import { ChangePasswordForm } from "../components/auth/ChangePasswordForm";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { isAuthenticated, userRole, mustChangePassword, passwordChanged } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  if (mustChangePassword) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
          <p className="mt-1 text-sm text-muted-foreground">TA รีเซ็ตรหัสผ่านให้แล้ว ตั้งรหัสผ่านของคุณเองก่อนใช้งานต่อ</p>
          <div className="mt-6">
            <ChangePasswordForm onDone={passwordChanged} currentLabel="รหัสผ่านปัจจุบัน" />
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

