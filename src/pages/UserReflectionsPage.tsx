"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, School, ClipboardList, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ReflectionsTable } from "@/components/reflections-table";
import { reflectionZones } from "@/components/reflection-zones";
import { BarometerVisual } from "@/components/barometer-visual";
import { formatDate } from "@/lib/utils";

interface Reflection {
  day: string;
  user_id: string;
  date: string;
  reflection: {
    barometer: string;
    tech_sessions: {
      session_name: string[];
      happy: string;
      improve: string;
    };
    non_tech_sessions: {
      session_name: string[];
      happy: string;
      improve: string;
    };
  };
}

interface User {
  cohort_number: number;
  email: string;
  first_name: string;
  last_name: string;
  jsd_number: string;
  role: string;
  _id: string;
}

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | JSX.Element }) => (
  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
    <div className={`p-2.5 rounded-full bg-primary/10 shrink-0`}>
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-2xl font-semibold truncate">{typeof value === "string" || typeof value === "number" ? value : value}</div>
    </div>
  </div>
);

export default function UserReflectionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserReflections = async () => {
      if (!id) {
        setError("No user ID provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/admin/userreflections/${id}`);
        if (response.data.data.reflections) {
          const sortedReflections = response.data.data.reflections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setReflections(sortedReflections);
          setUser(response.data.data.user);
        } else {
          setError("No reflections found");
        }
      } catch (error) {
        console.error("Error fetching user reflections:", error);
        setError("Failed to load user reflections");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserReflections();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const getZoneStats = () => {
    const stats = reflections.reduce(
      (acc, reflection) => {
        const zone = reflectionZones.find((z) => z.label === reflection.reflection.barometer);
        if (zone) {
          acc[zone.id] = (acc[zone.id] || 0) + 1;
        }
        return acc;
      },
      { comfort: 0, "stretch-enjoying": 0, "stretch-overwhelmed": 0, panic: 0 } as Record<string, number>
    );

    const total = reflections.length;
    const dominantZone = Object.entries(stats).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    return {
      ...stats,
      total,
      dominantZone,
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-10 w-40" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reflections
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <h2 className="text-lg font-semibold mb-2">Error Loading Reflections</h2>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getZoneStats();

  return (
    <div className="container mx-auto py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reflections
        </Button>
      </motion.div>

      {user && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Student Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Student Name" value={`${user.first_name} ${user.last_name}`} />
                <StatCard icon={School} label="JSD Number" value={user.jsd_number} />
                <StatCard icon={ClipboardList} label="Total Reflections" value={reflections.length} />
                <StatCard
                  icon={TrendingUp}
                  label="Most Common Zone"
                  value={
                    stats.total > 0 ? (
                      <div className="flex items-center gap-2 text-base">
                        <span className="shrink-0">{reflectionZones.find((z) => z.id === stats.dominantZone)?.emoji}</span>
                        <span className="truncate">{reflectionZones.find((z) => z.id === stats.dominantZone)?.label || "N/A"}</span>
                      </div>
                    ) : (
                      "No data"
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <ReflectionsTable reflections={reflections} />
    </div>
  );
}
