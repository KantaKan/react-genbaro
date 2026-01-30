"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { useQuery } from "react-query";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon: Icon, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="h-full"
  >
    <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="text-3xl font-bold">{value}</div>
        </motion.div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && "rotate-180"}`} />
            <span>{Math.abs(trend.value)}% from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

interface DashboardMetricsProps {
  cohort?: string;
}

export function DashboardMetrics({ cohort }: DashboardMetricsProps) {
  const { data: usersData, isLoading: isLoadingUsers } = useQuery(
    ["adminUsers", cohort],
    () => api.get(`/admin/users${cohort ? `?cohort=${cohort}&limit=500` : "?limit=500"}`),
    { enabled: true }
  );

  const { data: reflectionsData } = useQuery(
    ["weeklySummary", cohort],
    () => api.get(`/admin/reflections/weekly?limit=1${cohort ? `&cohort=${cohort}` : ""}`),
    { refetchOnWindowFocus: false }
  );

  const totalLearners = usersData?.data?.data?.users?.length || 0;
  
  const currentWeekSummary = reflectionsData?.data?.data?.summaries?.[0];
  const atRiskCount = 
    (currentWeekSummary?.overwhelmed_students?.length || 0) + 
    (currentWeekSummary?.stressed_students?.length || 0);

  if (isLoadingUsers) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Learners"
        value={totalLearners}
        description={cohort ? `Active in cohort ${cohort}` : "All active learners"}
        icon={Users}
        color="bg-blue-500"
      />
      <MetricCard
        title="Total Reflections"
        value={totalLearners > 0 ? "—" : "0"}
        description="All time submissions"
        icon={FileText}
        color="bg-emerald-500"
      />
      <MetricCard
        title="At-Risk Learners"
        value={atRiskCount}
        description="This week's panic/overwhelmed"
        icon={AlertTriangle}
        color="bg-red-500"
      />
      <MetricCard
        title="Active This Week"
        value={totalLearners > 0 ? totalLearners - atRiskCount : "—"}
        description="Submitted reflections"
        icon={Activity}
        color="bg-purple-500"
      />
    </div>
  );
}
