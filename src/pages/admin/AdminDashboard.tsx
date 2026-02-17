import { useState } from "react";
import BaroChart from "../../components/BigBaroChart";
import { DashboardMetrics } from "../../components/dashboard-metrics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminDashboard() {
  const [selectedCohort, setSelectedCohort] = useState<string | undefined>(
    () => {
      const saved = localStorage.getItem("selectedCohort");
      return saved ? (saved === "all" ? undefined : saved) : undefined;
    }
  );

  const handleCohortChange = (value: string) => {
    const cohortValue = value === "all" ? undefined : value;
    setSelectedCohort(cohortValue);
    localStorage.setItem("selectedCohort", value);
  };

  return (
    <div className="flex flex-col gap-6 overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of learner progress and reflection data
          </p>
        </div>
        <Select
          value={selectedCohort ?? "all"}
          onValueChange={handleCohortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Cohort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
            <SelectItem value="9">Cohort 9</SelectItem>
            <SelectItem value="10">Cohort 10</SelectItem>
            <SelectItem value="11">Cohort 11</SelectItem>
            <SelectItem value="12">Cohort 12</SelectItem>
            <SelectItem value="13">Cohort 13</SelectItem>
            <SelectItem value="14">Cohort 14</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DashboardMetrics cohort={selectedCohort} />

      <BaroChart cohort={selectedCohort} />
    </div>
  );
}

