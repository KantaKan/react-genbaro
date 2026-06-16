import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "react-query";
import { Link, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { api } from "../lib/api";
import { getAuthToken } from "@/infrastructure/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { 
  ArrowDownAZ, ArrowUpAZ, Users, GraduationCap, Crown, 
  Filter, ChevronDown, Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SkeletonCard } from "@/components/loading-skeleton";
import type { JWTPayload, User } from "@/domain/types";

export function AllUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCohort, setSelectedCohort] = useState<number | "all">(
    () => {
      const cohortParam = searchParams.get("cohort");
      if (!cohortParam || cohortParam === "all") return "all";
      const num = Number(cohortParam);
      return isNaN(num) ? "all" : num;
    }
  );

  const handleCohortChange = (value: number | "all") => {
    setSelectedCohort(value);
    setSearchParams((prev) => {
      if (value === "all") {
        prev.delete("cohort");
      } else {
        prev.set("cohort", String(value));
      }
      return prev;
    });
  };

  const { currentCohort, isAdmin } = useMemo(() => {
    try {
      const token = getAuthToken();
      if (token) {
        const decoded = jwtDecode<JWTPayload>(token);
        return {
          currentCohort: decoded.cohort ?? null,
          isAdmin: decoded.role === "admin"
        };
      }
    } catch (e) {
      console.error("Failed to decode token:", e);
    }
    return { currentCohort: null, isAdmin: false };
  }, []);

  // Fetch users with a high limit for admin to see everyone
  const { data: response, isLoading, error } = useQuery(
    ["allUsers", isAdmin ? "admin" : "learner"], 
    async () => {
      const response = await api.get(`/users?limit=1000${isAdmin ? "" : `&cohort=${currentCohort}`}`);
      return response.data.data.users as User[];
    }
  );

  const availableCohorts = useMemo(() => {
    if (!response) return [];
    const cohorts = Array.from(new Set(response.map(u => u.cohort_number))).sort((a, b) => b - a);
    return cohorts;
  }, [response]);

  if (isLoading)
    return (
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-0">
          <SkeletonCard count={8} />
        </CardContent>
      </Card>
    );

  if (error) return <div className="text-center py-10 text-destructive">Error loading users</div>;

  const allUsers = response ?? [];
  const users = selectedCohort === "all" 
    ? allUsers 
    : allUsers.filter(u => u.cohort_number === selectedCohort);

  const sortedUsers = [...users].sort((a, b) => {
    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
    return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-4 rounded-2xl border border-border/50 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-700 h-9 px-3 rounded-lg font-bold transition-all">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>
                    {selectedCohort === "all" ? "All Learners" : `Cohort ${selectedCohort}`}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by Cohort</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleCohortChange("all")} className="flex justify-between items-center">
                  All Cohorts {selectedCohort === "all" && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
                {availableCohorts.map(c => (
                  <DropdownMenuItem key={c} onClick={() => handleCohortChange(c)} className="flex justify-between items-center">
                    Cohort {c} {selectedCohort === c && <Check className="w-4 h-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary text-sm">
                Cohort {currentCohort || "?"}
              </span>
            </div>
          )}
          <span className="text-muted-foreground text-sm font-medium">
            {users.length} member{users.length !== 1 ? "s" : ""} 
            {isAdmin && selectedCohort === "all" && <span className="ml-1 text-amber-500/80 font-bold">(Global View)</span>}
          </span>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="font-bold gap-2 hover:bg-primary/10 hover:text-primary rounded-xl"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpAZ className="w-4 h-4" />}
            <span className="hidden sm:inline">Sort Name</span> {sortOrder === "asc" ? "(A-Z)" : "(Z-A)"}
          </Button>
        </div>
      </div>

      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {users.length > 0 ? (
              users.map((user) => (
                <Link key={user._id} to={`/profile/${user._id}`}>
                  <Card className="hover:bg-card hover:scale-[1.02] hover:shadow-lg transition-all duration-300 border-none shadow-sm group bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <UserAvatar 
                        userId={user._id} 
                        name={`${user.first_name} ${user.last_name}`} 
                        className="w-14 h-14 ring-4 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-md"
                      />
                      <div className="overflow-hidden">
                        <p className="font-black text-lg group-hover:text-primary transition-colors truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-black italic">
                            JSD-{user.jsd_number || "???"}
                          </p>
                          <span className="text-[9px] bg-secondary/50 px-1.5 py-0.5 rounded text-secondary-foreground font-medium">
                            C{user.cohort_number}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
                <p className="text-muted-foreground font-medium">
                  {isAdmin ? "No learners found." : "No other learners found in your cohort."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
