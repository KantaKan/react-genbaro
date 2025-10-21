import React, { useState } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingDown, UserX } from "lucide-react";
import { getDayBadge } from "@/utils/day-colors"; // New import

const DayBadgeComponent: React.FC<{ dateString: string }> = ({ dateString }) => {
  const { dayName, colorClass } = getDayBadge(dateString);
  return <Badge className={colorClass}>{dayName}</Badge>;
};


interface StudentInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  zoom_name: string;
  jsd_number: string;
  barometer: string;
  date: string;
}

interface WeeklySummary {
  week_start_date: string;
  week_end_date: string;
  stressed_students: StudentInfo[];
  overwhelmed_students: StudentInfo[];
}

interface ApiResponse {
  summaries: WeeklySummary[];
  total: number;
  page: number;
  limit: number;
}

const fetchWeeklySummary = async (page: number, limit: number): Promise<ApiResponse> => {
  const response = await api.get("/admin/reflections/weekly", {
    params: { page, limit },
  });
  return response.data.data;
};

const WeeklySummarySkeleton: React.FC = () => (
  <div className="space-y-8">
    {[...Array(2)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-2/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-2/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    ))}
  </div>
);


const WeeklySummaryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 5; // 5 weeks per page

  const { data, isLoading, error } = useQuery<ApiResponse, Error>(
    ["weeklySummary", page, limit],
    () => fetchWeeklySummary(page, limit),
    { keepPreviousData: true }
  );

  const getStudentName = (student: StudentInfo) => {
    const fullName = `${student.first_name} ${student.last_name}`.trim();
    return (student.zoom_name && student.zoom_name.trim()) || fullName || 'Unknown Student';
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Weekly Summary of At-Risk Learners</h1>
        <WeeklySummarySkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
         <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load weekly summary. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Weekly Summary of At-Risk Learners</h1>
      <div className="space-y-12">
        {data?.summaries.map((summary, index) => (
          <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-2xl">
                Week: {new Date(summary.week_start_date).toLocaleDateString()} - {new Date(summary.week_end_date).toLocaleDateString()}
              </CardTitle>
              <CardDescription>A summary of learners who reported being in the "Panic" or "Overwhelmed" zones.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-6 w-6 text-red-500" />
                    <h3 className="text-xl font-semibold">Panic Zone</h3>
                  </div>
                  <Badge variant="destructive">{summary.overwhelmed_students?.length || 0}</Badge>
                </CardHeader>
                <CardContent>
                  {summary.overwhelmed_students && summary.overwhelmed_students.length > 0 ? (
                    <ul className="space-y-3">
                      {summary.overwhelmed_students.map((student: StudentInfo) => (
                        <li key={student.user_id + student.date} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                          <Link to={`/admin/table/${student.user_id}`} className="font-medium text-primary hover:underline">
                            {getStudentName(student)}
                          </Link>
                          <span className="text-sm text-muted-foreground"><DayBadgeComponent dateString={student.date} /></span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <UserX className="h-12 w-12 mx-auto mb-2" />
                      <p>No learners in the Panic Zone this week.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                    <h3 className="text-xl font-semibold">Stretch Zone - Overwhelmed</h3>
                  </div>
                  <Badge variant="secondary">{summary.stressed_students?.length || 0}</Badge>
                </CardHeader>
                <CardContent>
                  {summary.stressed_students && summary.stressed_students.length > 0 ? (
                     <ul className="space-y-3">
                      {summary.stressed_students.map((student: StudentInfo) => (
                         <li key={student.user_id + student.date} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                          <Link to={`/admin/table/${student.user_id}`} className="font-medium text-primary hover:underline">
                            {getStudentName(student)}
                          </Link>
                          <span className="text-sm text-muted-foreground"><DayBadgeComponent dateString={student.date} /></span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <UserX className="h-12 w-12 mx-auto mb-2" />
                      <p>No learners in the Overwhelmed Zone this week.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination className="mt-12">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={page === i + 1} onClick={() => handlePageChange(i + 1)}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default WeeklySummaryPage;