import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

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

const reflectionZones = [
  { id: "comfort", label: "Comfort Zone", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  { id: "stretch-enjoying", label: "Stretch zone - Enjoying the challenges", color: "text-amber-700", bgColor: "bg-amber-100" },
  { id: "stretch-overwhelmed", label: "Stretch zone - Overwhelmed", color: "text-orange-700", bgColor: "bg-orange-100" },
  { id: "panic", label: "Panic Zone", color: "text-rose-700", bgColor: "bg-rose-100" },
];

const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? `${zone.color} ${zone.bgColor}` : "";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() === 1) {
    return "No date";
  }
  return date.toLocaleDateString();
};

export default function UserReflections() {
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

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reflections
        </Button>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Button onClick={handleBack} variant="outline" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reflections
      </Button>

      {user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="font-semibold">Name</p>
                <p>
                  {user.first_name} {user.last_name}
                </p>
              </div>
              <div>
                <p className="font-semibold">JSD Number</p>
                <p>{user.jsd_number}</p>
              </div>
              <div>
                <p className="font-semibold">Cohort</p>
                <p>{user.cohort_number}</p>
              </div>
              <div>
                <p className="font-semibold">Total Reflections</p>
                <p>{reflections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Tech Sessions</TableHead>
            <TableHead>Tech Happy</TableHead>
            <TableHead>Tech Improve</TableHead>
            <TableHead>Non-Tech Sessions</TableHead>
            <TableHead>Non-Tech Happy</TableHead>
            <TableHead>Non-Tech Improve</TableHead>
            <TableHead>Barometer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reflections.map((reflection) => (
            <TableRow key={reflection.date}>
              <TableCell>{formatDate(reflection.date)}</TableCell>
              <TableCell>{reflection.reflection.tech_sessions?.session_name?.join(", ") || ""}</TableCell>
              <TableCell>{reflection.reflection.tech_sessions?.happy || ""}</TableCell>
              <TableCell>{reflection.reflection.tech_sessions?.improve || ""}</TableCell>
              <TableCell>{reflection.reflection.non_tech_sessions?.session_name?.join(", ") || ""}</TableCell>
              <TableCell>{reflection.reflection.non_tech_sessions?.happy || ""}</TableCell>
              <TableCell>{reflection.reflection.non_tech_sessions?.improve || ""}</TableCell>
              <TableCell className={getColorForBarometer(reflection.reflection.barometer)}>{reflection.reflection.barometer}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
