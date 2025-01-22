import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

interface Reflection {
  _id: string;
  user_id: string;
  FirstName: string;
  LastName: string;
  JsdNumber: string;
  Date: string;
  id: string;
  Reflection: {
    Barometer: string;
    TechSessions?: {
      SessionName?: string[] | null;
      Happy?: string;
      Improve?: string;
    };
    NonTechSessions?: {
      SessionName?: string[] | null;
      Happy?: string;
      Improve?: string;
    };
  };
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
        // Using the same endpoint structure as your admin table
        const response = await api.get(`users/${id}/reflections`);
        if (response.data.success && Array.isArray(response.data.data)) {
          setReflections(response.data.data);
          console.log(response);
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
    navigate("/admin/table");
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

  const userDetails = reflections[0] || null;

  return (
    <div className="container mx-auto py-10">
      <Button onClick={handleBack} variant="outline" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reflections
      </Button>

      {userDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-semibold">Name</p>
                <p>
                  {userDetails.FirstName} {userDetails.LastName}
                </p>
              </div>
              <div>
                <p className="font-semibold">JSD Number</p>
                <p>{userDetails.JsdNumber}</p>
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
            <TableRow key={reflection._id}>
              <TableCell>{formatDate(reflection.Date)}</TableCell>
              <TableCell>{reflection.Reflection?.TechSessions?.Happy || ""}</TableCell>
              <TableCell>{reflection.Reflection?.TechSessions?.Improve || ""}</TableCell>
              <TableCell>{reflection.Reflection?.NonTechSessions?.Happy || ""}</TableCell>
              <TableCell>{reflection.Reflection?.NonTechSessions?.Improve || ""}</TableCell>
              <TableCell className={getColorForBarometer(reflection.Reflection?.Barometer || "")}>{reflection.Reflection?.Barometer || ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
