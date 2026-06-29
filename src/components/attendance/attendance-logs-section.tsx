import { Trash2 } from "lucide-react";
import { getStatusLabel } from "@/lib/attendance-status";

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

function StatusStamp({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    present: "var(--register-stamp-present)",
    late: "var(--register-stamp-late)",
    absent: "var(--register-stamp-absent)",
    late_excused: "var(--register-stamp-excused)",
    absent_excused: "var(--register-stamp-excused)",
    no_class: "var(--register-stamp-excused)",
    holiday: "var(--register-stamp-holiday)",
    dropout: "var(--register-stamp-absent)",
    dismissed: "var(--register-stamp-absent)",
  };
  const color = colorMap[status] || "var(--register-muted-ink)";
  return (
    <span
      className="register-status-stamp"
      style={{
        borderColor: `hsl(${color})`,
        color: `hsl(${color})`,
        backgroundColor: `hsl(${color} / 0.08)`,
      }}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function AttendanceLogsSection({ logs, onDelete }: AttendanceLogsSectionProps) {
  const filteredLogs = logs.filter((l) => !l.deleted);

  return (
    <div>
      <div className="flex items-center gap-4 px-4 py-2 bg-[hsl(var(--primary))]/10 border border-[hsl(var(--border))]">
        <span className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
          Audit Log
        </span>
        <span className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))]">
          {filteredLogs.length} entries
        </span>
      </div>

      <div className="flex items-center gap-4 px-4 py-1.5 border-x border-[hsl(var(--border))] bg-[hsl(var(--secondary))] font-register-mono text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">
        <span className="w-24">Date</span>
        <span className="w-20">JSD</span>
        <span className="flex-1">Name</span>
        <span className="w-16 text-center">Session</span>
        <span className="w-24 text-center">Status</span>
        <span className="w-20 text-center">Marked By</span>
        <span className="w-14 text-center" />
      </div>

      <div className="border-x border-b border-[hsl(var(--border))]">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 font-register-body text-sm text-[hsl(var(--muted-foreground))]">
            No logs found
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log._id}
              className="flex items-center gap-4 px-4 py-2 border-b border-[hsl(var(--border))]/50 last:border-b-0 hover:bg-[hsl(var(--primary))]/[0.02] transition-colors"
            >
              <span className="font-register-mono text-xs text-[hsl(var(--foreground))] w-24">{log.date}</span>
              <span className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] w-20 truncate">{log.jsd_number}</span>
              <span className="font-register-body text-sm text-[hsl(var(--foreground))] flex-1 min-w-0 truncate">
                {log.first_name} {log.last_name}
              </span>
              <span className="w-16 text-center font-register-mono text-xs capitalize text-[hsl(var(--foreground))]">{log.session}</span>
              <span className="w-24 text-center flex justify-center"><StatusStamp status={log.status} /></span>
              <span className="w-20 text-center font-register-mono text-xs capitalize text-[hsl(var(--foreground))]">{log.marked_by}</span>
              <div className="w-14 text-center">
                <button
                  onClick={() => onDelete(log)}
                  className="text-[hsl(var(--register-stamp-absent))] hover:opacity-70 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 inline" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
