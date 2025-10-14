import { useEffect, useState } from "react";
import { AdminUsersTable } from "@/components/admin-users-table";
import { api } from "@/lib/api";

interface TechSession {
  happy: string;
  improve: string;
  session_name: string[];
}

interface NonTechSession {
  happy: string;
  improve: string;
  session_name: string[];
}

interface Reflection {
  createdAt: string;
  date: string;
  day: string;
  reflection: {
    barometer: string;
    tech_sessions: TechSession;
    non_tech_sessions: NonTechSession;
  };
  user_id: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  jsd_number: string;
  email: string;
  cohort_number: number;
  password: string;
  reflections: Reflection[] | null;
  role: string;
  zoom_name: string;
  project_group: string;
  genmate_group: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: {
    limit: number;
    page: number;
    total: number;
    users: User[];
  };
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<ApiResponse>("/admin/users?cohort=11");
        setUsers(response.data.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <AdminUsersTable users={users} isLoading={isLoading} />
    </div>
  );
}
