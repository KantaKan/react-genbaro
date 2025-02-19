import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "./ui/skeleton";

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
  { id: "comfort", label: "Comfort Zone", bgColor: "bg-green-500" },
  { id: "stretch-enjoying", label: "Stretch zone - Enjoying the challenges", bgColor: "bg-yellow-500" },
  { id: "stretch-overwhelmed", label: "Stretch zone - Overwhelmed", bgColor: "bg-orange-500" },
  { id: "panic", label: "Panic Zone", bgColor: "bg-red-500" },
];

const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? `${zone.bgColor}` : "";
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
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-10 w-40 mb-4" />

        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-md">
          <div className="border-b">
            <div className="flex p-4">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-6 flex-1 mr-2" />
              ))}
            </div>
          </div>
          {[...Array(5)].map((_, rowIndex) => (
            <div key={rowIndex} className="flex p-4 border-b last:border-b-0">
              {[...Array(6)].map((_, cellIndex) => (
                <Skeleton key={cellIndex} className="h-4 flex-1 mr-2" />
              ))}
            </div>
          ))}
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

            <TableHead>Tech Happy</TableHead>
            <TableHead>Tech Improve</TableHead>

            <TableHead>Non-Tech Happy</TableHead>
            <TableHead>Non-Tech Improve</TableHead>
            <TableHead>Barometer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reflections.map((reflection) => (
            <TableRow key={reflection.date}>
              <TableCell>{formatDate(reflection.date)}</TableCell>
              <TableCell>{reflection.reflection.tech_sessions?.happy || ""}</TableCell>
              <TableCell>{reflection.reflection.tech_sessions?.improve || ""}</TableCell>
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
