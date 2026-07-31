import { useState } from "react";
import { GenmateGarden } from "@/components/genmate-garden";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GenmateGardenPage() {
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
    <div className="container mx-auto py-10">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Genmate Garden</h1>
          <p className="text-muted-foreground mt-1">
            Learners grouped by their genmate group, grown through reflection streaks
          </p>
        </div>
        <Select
          value={selectedCohort ?? "all"}
          onValueChange={handleCohortChange}
        >
          <SelectTrigger className="w-[180px] cursor-pointer" aria-label="Select cohort">
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

      <GenmateGarden cohort={selectedCohort} />
    </div>
  );
}
