import { Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LogRecord {
  _id: string;
  date: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  session: string;
  status: string;
  marked_by: string;
  deleted?: boolean;
}

interface AttendanceLogsSectionProps {
  logs: LogRecord[];
  onDelete: (log: LogRecord) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "present":
      return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
    case "late":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Late</Badge>;
    case "absent":
      return <Badge className="bg-red-500 hover:bg-red-600">Absent</Badge>;
    case "late_excused":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Late Excused</Badge>;
    case "absent_excused":
      return <Badge className="bg-gray-500 hover:bg-gray-600">Absent Excused</Badge>;
    case "no_class":
      return <Badge className="bg-purple-500 hover:bg-purple-600">No Class</Badge>;
    case "holiday":
      return <Badge className="bg-orange-500 hover:bg-orange-600">Holiday</Badge>;
    case "dropout":
      return <Badge className="bg-red-700 hover:bg-red-800">Dropout</Badge>;
    case "dismissed":
      return <Badge className="bg-red-800 hover:bg-red-900">Dismissed</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
}

export function AttendanceLogsSection({ logs, onDelete }: AttendanceLogsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>JSD</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.filter(l => !l.deleted).map((log) => (
              <TableRow key={log._id}>
                <TableCell>{log.date}</TableCell>
                <TableCell>{log.jsd_number}</TableCell>
                <TableCell>{log.first_name} {log.last_name}</TableCell>
                <TableCell className="capitalize">{log.session}</TableCell>
                <TableCell>{getStatusBadge(log.status)}</TableCell>
                <TableCell className="capitalize">{log.marked_by}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => onDelete(log)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
