
import React, { useState } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Weekly Summary of At-Risk Learners</h1>
      <div className="space-y-8">
        {data?.summaries.map((summary, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>
                Week: {new Date(summary.week_start_date).toLocaleDateString()} - {new Date(summary.week_end_date).toLocaleDateString()}
              </CardTitle>
              <CardDescription>Learners in "Panic" or "Overwhelmed" zones.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Panic Zone 🙀</h3>
                  {summary.overwhelmed_students && summary.overwhelmed_students.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.overwhelmed_students?.map((student: StudentInfo) => (
                          <TableRow key={student.user_id + student.date}>
                            <TableCell>
                              <Link to={`/admin/table/${student.user_id}`} className="text-blue-500 hover:underline">
                                {getStudentName(student)}
                              </Link>
                            </TableCell>
                            <TableCell>{new Date(student.date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No learners in the Panic Zone this week.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Stretch Zone - Overwhelmed 😿</h3>
                  {summary.stressed_students && summary.stressed_students.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.stressed_students?.map((student: StudentInfo) => (
                          <TableRow key={student.user_id + student.date}>
                            <TableCell>
                              <Link to={`/admin/table/${student.user_id}`} className="text-blue-500 hover:underline">
                                {getStudentName(student)}
                              </Link>
                            </TableCell>
                            <TableCell>{new Date(student.date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No learners in the Overwhelmed Zone this week.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={page === i + 1} onClick={() => handlePageChange(i + 1)}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => handlePageChange(page + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default WeeklySummaryPage;
