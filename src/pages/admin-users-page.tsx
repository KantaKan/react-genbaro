import { useEffect, useState } from "react";
import { AdminUsersTable } from "@/components/admin-users-table";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [cohort, setCohort] = useState("11");

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<ApiResponse>(
          `/admin/users?cohort=${cohort}`
        );
        setUsers(response.data.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [cohort]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center space-x-2">
          <label htmlFor="cohort-select">Cohort:</label>
          <Select value={cohort} onValueChange={setCohort}>
            <SelectTrigger id="cohort-select" className="w-[180px]">
              <SelectValue placeholder="Select a cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9">9</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="11">11</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <AdminUsersTable users={users} isLoading={isLoading} />
    </div>
  );
}
