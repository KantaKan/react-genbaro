import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, Eye, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentStat {
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  present: number;
  late: number;
  absent: number;
  absent_days: number;
  late_excused: number;
  absent_excused: number;
  warning_level: string;
}

interface AttendanceStudentTableProps {
  cohort: string;
  stats: StudentStat[];
}

function getWarningBadge(level: string) {
  switch (level) {
    case "red":
      return <Badge className="bg-red-500">Critical</Badge>;
    case "yellow":
      return <Badge className="bg-yellow-500">Warning</Badge>;
    default:
      return <Badge className="bg-green-500">Good</Badge>;
  }
}

type SortKey = "absent_days_desc" | "absent_desc" | "present_desc" | "name_asc" | "name_desc" | "warning_asc" | "jsd_asc" | "jsd_desc" | "absent_days_asc" | "absent_asc" | "present_asc";

const jsdNum = (jsd?: string) => {
  if (!jsd) return 9999;
  const match = jsd.match(/GEN\d+_(\d+)/i);
  return match ? parseInt(match[1], 10) : 9999;
};

const warningOrder = { red: 0, yellow: 1, normal: 2 };

function getSortedStats(data: StudentStat[], sortOption: SortKey) {
  const sorted = [...data];
  switch (sortOption) {
    case "absent_days_desc": return sorted.sort((a, b) => b.absent_days - a.absent_days);
    case "absent_days_asc": return sorted.sort((a, b) => a.absent_days - b.absent_days);
    case "absent_desc": return sorted.sort((a, b) => b.absent - a.absent);
    case "absent_asc": return sorted.sort((a, b) => a.absent - b.absent);
    case "present_desc": return sorted.sort((a, b) => b.present - a.present);
    case "present_asc": return sorted.sort((a, b) => a.present - b.present);
    case "name_asc": return sorted.sort((a, b) => a.first_name.localeCompare(b.first_name));
    case "name_desc": return sorted.sort((a, b) => b.first_name.localeCompare(a.first_name));
    case "warning_asc": return sorted.sort((a, b) => warningOrder[a.warning_level] - warningOrder[b.warning_level]);
    case "jsd_asc": return sorted.sort((a, b) => jsdNum(a.jsd_number) - jsdNum(b.jsd_number));
    case "jsd_desc": return sorted.sort((a, b) => jsdNum(b.jsd_number) - jsdNum(a.jsd_number));
    default: return sorted.sort((a, b) => b.absent_days - a.absent_days);
  }
}

export function AttendanceStudentTable({ cohort, stats }: AttendanceStudentTableProps) {
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<SortKey>("absent_days_desc");

  const sortedStats = useMemo(() => getSortedStats(stats, sortOption), [stats, sortOption]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Students - Cohort {cohort}
            </CardTitle>
            <CardDescription>
              Attendance summary for all students in this cohort
            </CardDescription>
          </div>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="absent_days_desc">Most Absent Days</SelectItem>
              <SelectItem value="absent_desc">Most Absent Sessions</SelectItem>
              <SelectItem value="present_desc">Most Present</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
              <SelectItem value="name_desc">Name Z-A</SelectItem>
              <SelectItem value="warning_asc">Warning (Critical first)</SelectItem>
              <SelectItem value="jsd_asc">JSD Number</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <button
                  onClick={() => setSortOption((prev) => (prev === "jsd_asc" ? "jsd_desc" : "jsd_asc"))}
                  className="flex items-center gap-1.5 hover:text-foreground/70 transition-colors"
                >
                  JSD #
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground ml-1" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => setSortOption((prev) => (prev === "name_asc" ? "name_desc" : "name_asc"))}
                  className="flex items-center gap-1.5 hover:text-foreground/70 transition-colors"
                >
                  Name
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground ml-1" />
                </button>
              </TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Late</TableHead>
              <TableHead className="text-center">Absent Sessions</TableHead>
              <TableHead className="text-center">Absent Days</TableHead>
              <TableHead className="text-center">Excused</TableHead>
              <TableHead className="text-center">Warning</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No attendance data available
                </TableCell>
              </TableRow>
            ) : (
              sortedStats.map((student) => (
                <TableRow key={student.user_id}>
                  <TableCell className="font-medium">{student.jsd_number}</TableCell>
                  <TableCell>{student.first_name} {student.last_name}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600 font-medium">{student.present}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-yellow-600 font-medium">{student.late}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-600 font-medium">{student.absent}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-700 font-bold">{student.absent_days}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-blue-600 font-medium">{student.late_excused + student.absent_excused}</span>
                  </TableCell>
                  <TableCell className="text-center">{getWarningBadge(student.warning_level)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => navigate(`/admin/attendance/student/${student.user_id}`)}
                      className="text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 text-sm"
                      title="View full details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
