import React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingDown, TrendingUp, UserX } from "lucide-react";
import { getDayBadge } from "@/utils/day-colors";

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

interface LatestWeeklySummaryProps {
   cohort?: string;
}

const LatestWeeklySummarySkeleton: React.FC = () => (
     <Card>
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
 );


const LatestWeeklySummary: React.FC<LatestWeeklySummaryProps> = ({ cohort }) => {
   const fetchLatestWeeklySummary = async (): Promise<WeeklySummary | null> => {
     const response = await api.get("/admin/reflections/weekly", {
       params: { page: 1, limit: 1, cohort: cohort || undefined },
     });
     if (response.data.data && response.data.data.summaries && response.data.data.summaries.length > 0) {
       return response.data.data.summaries[0];
     }
     return null;
   };

   const { data: summary, isLoading, error } = useQuery<WeeklySummary | null, Error>(
     ["latestWeeklySummary", cohort],
     fetchLatestWeeklySummary
   );

   const fetchAllWeeklySummaries = async (): Promise<ApiResponse> => {
     const response = await api.get("/admin/reflections/weekly", {
       params: { page: 1, limit: 2, cohort: cohort || undefined },
     });
     return response.data.data;
   };

   const { data: allSummaries } = useQuery<ApiResponse, Error>(
     ["allWeeklySummaries", cohort],
     fetchAllWeeklySummaries,
     { enabled: !!summary }
   );

   const getStudentName = (student: StudentInfo) => {
     const fullName = `${student.first_name} ${student.last_name}`.trim();
     return (student.zoom_name && student.zoom_name.trim()) || fullName || 'Unknown Student';
   };

   const calculateTrend = (current: number, previous: number) => {
     if (previous === 0) return { value: 0, isPositive: true };
     const change = ((current - previous) / previous) * 100;
     return {
       value: Math.abs(Math.round(change)),
       isPositive: change < 0
     };
   };

   if (isLoading) {
     return <LatestWeeklySummarySkeleton />;
   }

   if (error) {
     return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
         <AlertCircle className="h-4 w-4" />
         <AlertTitle>Error</AlertTitle>
         <AlertDescription>
           Failed to load weekly summary. Please try again later.
         </AlertDescription>
       </Alert>
     );
   }

   if (!summary) {
     return (
         <div className="text-center text-muted-foreground py-8">
             <UserX className="h-12 w-12 mx-auto mb-2" />
             <p>No weekly summary data available.</p>
         </div>
     )
   }

   return (
     <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
       <CardHeader className="bg-muted/30 pb-4">
         <CardTitle className="text-lg">
           Week: {new Date(summary.week_start_date).toLocaleDateString()} - {new Date(summary.week_end_date).toLocaleDateString()}
         </CardTitle>
         <CardDescription className="text-sm">At-risk learners overview</CardDescription>
       </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 gap-4">
        <Card className="bg-background border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="text-base font-semibold">Panic Zone</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">{summary.overwhelmed_students?.length || 0}</Badge>
              {allSummaries?.summaries?.[1] && (
                <div className={`flex items-center gap-1 text-xs ${
                  calculateTrend(summary.overwhelmed_students?.length || 0, allSummaries.summaries[1].overwhelmed_students?.length || 0).isPositive 
                  ? "text-green-500" : "text-red-500"
                }`}>
                  {calculateTrend(summary.overwhelmed_students?.length || 0, allSummaries.summaries[1].overwhelmed_students?.length || 0).isPositive 
                  ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{calculateTrend(summary.overwhelmed_students?.length || 0, allSummaries.summaries[1].overwhelmed_students?.length || 0).value}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {summary.overwhelmed_students && summary.overwhelmed_students.length > 0 ? (
              <ul className="space-y-2">
                {summary.overwhelmed_students.slice(0, 3).map((student: StudentInfo) => (
                  <li key={student.user_id + student.date} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                    <Link to={`/admin/table/${student.user_id}`} className="font-medium text-primary hover:underline text-sm">
                      {getStudentName(student)}
                    </Link>
                    <span className="text-xs text-muted-foreground"><DayBadgeComponent dateString={student.date} /></span>
                  </li>
                ))}
                {summary.overwhelmed_students.length > 3 && (
                  <li className="text-xs text-muted-foreground text-center">
                    +{summary.overwhelmed_students.length - 3} more
                  </li>
                )}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <UserX className="h-8 w-8 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No learners</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-base font-semibold">Overwhelmed</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{summary.stressed_students?.length || 0}</Badge>
              {allSummaries?.summaries?.[1] && (
                <div className={`flex items-center gap-1 text-xs ${
                  calculateTrend(summary.stressed_students?.length || 0, allSummaries.summaries[1].stressed_students?.length || 0).isPositive 
                  ? "text-green-500" : "text-red-500"
                }`}>
                  {calculateTrend(summary.stressed_students?.length || 0, allSummaries.summaries[1].stressed_students?.length || 0).isPositive 
                  ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{calculateTrend(summary.stressed_students?.length || 0, allSummaries.summaries[1].stressed_students?.length || 0).value}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {summary.stressed_students && summary.stressed_students.length > 0 ? (
              <ul className="space-y-2">
                {summary.stressed_students.slice(0, 3).map((student: StudentInfo) => (
                  <li key={student.user_id + student.date} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                    <Link to={`/admin/table/${student.user_id}`} className="font-medium text-primary hover:underline text-sm">
                      {getStudentName(student)}
                    </Link>
                    <span className="text-xs text-muted-foreground"><DayBadgeComponent dateString={student.date} /></span>
                  </li>
                ))}
                {summary.stressed_students.length > 3 && (
                  <li className="text-xs text-muted-foreground text-center">
                    +{summary.stressed_students.length - 3} more
                  </li>
                )}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <UserX className="h-8 w-8 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No learners</p>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default LatestWeeklySummary;
