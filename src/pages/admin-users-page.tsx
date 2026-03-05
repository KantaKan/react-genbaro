import { useEffect, useState } from "react";
import { AdminUsersTable } from "@/components/admin-users-table";
import { SalesforceExportButton } from "@/components/salesforce-export";
import { SalesforceIDManager } from "@/components/salesforce-id-manager";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_number: number;
  jsd_number?: string;
  project_group?: string;
  genmate_group?: string;
  zoom_name?: string;
  salesforce_id?: string;
  reflections?: Array<{ reflection: { barometer: string } }>;
}

interface ApiResponse {
  data: {
    users: User[];
    total: number;
    page: number;
    limit: number;
  };
}

type Tab = "users" | "salesforce";

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cohort, setCohort] = useState("12");
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const fetchUsers = async (cohortValue: string) => {
    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse>(
        `/admin/users?cohort=${cohortValue}&role=learner&limit=200`
      );
      setUsers(response.data.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(cohort);
  }, [cohort]);

  const handleSalesforceIDUpdate = (userId: string, newId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, salesforce_id: newId } : u))
    );
  };

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "users", label: "User Table", emoji: "👥" },
    { key: "salesforce", label: "Salesforce IDs", emoji: "☁️" },
  ];

  return (
    <div className="container mx-auto py-10">
      {/* Page header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <div className="flex items-center gap-3">
          {/* Cohort selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="cohort-select" className="text-sm text-white/60">
              Cohort:
            </label>
            <Select value={cohort} onValueChange={setCohort}>
              <SelectTrigger id="cohort-select" className="w-[140px]">
                <SelectValue placeholder="Select cohort" />
              </SelectTrigger>
              <SelectContent>
                {[9, 10, 11, 12, 13].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Salesforce export button — always visible */}
          <SalesforceExportButton cohort={Number(cohort)} />
        </div>
      </div>

      {/* Tab switcher */}
      <div
        className="flex items-center gap-1 p-1 mb-6 rounded-xl w-fit"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? "rgba(99,102,241,0.3)" : "transparent",
              color: activeTab === tab.key ? "white" : "rgba(255,255,255,0.45)",
              border: activeTab === tab.key ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
            }}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "users" && (
        <AdminUsersTable users={users as never} isLoading={isLoading} />
      )}

      {activeTab === "salesforce" && (
        <SalesforceIDManager
          users={users}
          onUpdate={handleSalesforceIDUpdate}
        />
      )}
    </div>
  );
}
