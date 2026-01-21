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
import { Input } from "@/components/ui/input";

// ... (interfaces remain the same)

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cohort, setCohort] = useState("11");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.zoom_name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center space-x-4">
          <Input
            type="search"
            placeholder="Search users..."
            className="w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
      </div>
      <AdminUsersTable users={filteredUsers} isLoading={isLoading} />
    </div>
  );
}
