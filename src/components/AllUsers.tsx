import React, { useState, useMemo } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getAllUsers } from "../lib/api";
import { getAuthToken } from "@/infrastructure/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { ArrowDownAZ, ArrowUpAZ, Users, GraduationCap, Crown } from "lucide-react";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import type { JWTPayload } from "@/domain/types";

export function AllUsers() {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { data: response, isLoading, error } = useQuery("allUsers", getAllUsers);

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

  if (isLoading)
    return (
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-0">
          {[...Array(8)].map((_, i) => (
            <SkeletonLoader key={i} height="80px" className="rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );

  if (error) return <div className="text-center py-10 text-destructive">Error loading users</div>;

  const allUsers = response ?? [];
  const users = isAdmin 
    ? allUsers 
    : allUsers.filter(u => u.cohort_number === currentCohort);

  const sortedUsers = [...users].sort((a, b) => {
    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
    return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border/50">
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-600 text-sm">
                All Learners (Admin View)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary text-sm">
                Cohort {currentCohort || "?"}
              </span>
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            {users.length} member{users.length !== 1 ? "s" : ""} {isAdmin && <span className="text-amber-500">(all cohorts)</span>}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="font-bold gap-2 hover:bg-primary/10 hover:text-primary"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpAZ className="w-4 h-4" />}
          Sort Name {sortOrder === "asc" ? "(A-Z)" : "(Z-A)"}
        </Button>
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
