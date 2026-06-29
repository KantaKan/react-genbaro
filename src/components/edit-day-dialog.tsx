"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import { manualMarkAttendance, deleteAttendanceRecord, type AttendanceRecord } from "@/lib/api";
import { Sun, Sunset, Trash2 } from "lucide-react";

interface EditDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: string;
  morningStatus?: string;
  afternoonStatus?: string;
  morningRecordId?: string;
  afternoonRecordId?: string;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: "present", label: "Present", stamp: "present" },
  { value: "late", label: "Late", stamp: "late" },
  { value: "absent", label: "Absent", stamp: "absent" },
  { value: "late_excused", label: "Late (Excused)", stamp: "excused" },
  { value: "absent_excused", label: "Absent (Excused)", stamp: "excused" },
  { value: "no_class", label: "No Class", stamp: "holiday" },
  { value: "holiday", label: "Holiday", stamp: "holiday" },
  { value: "dropout", label: "Dropout", stamp: "absent" },
  { value: "dismissed", label: "Dismissed", stamp: "absent" },
  { value: "", label: "Clear / Unset", stamp: "" },
];

const STATUS_STAMP_COLORS: Record<string, string> = {
  present: "bg-[hsl(var(--register-stamp-present))] border-[hsl(var(--register-stamp-present))]",
  late: "bg-[hsl(var(--register-stamp-late))] border-[hsl(var(--register-stamp-late))]",
  absent: "bg-[hsl(var(--register-stamp-absent))] border-[hsl(var(--register-stamp-absent))]",
  excused: "bg-[hsl(var(--register-stamp-excused))] border-[hsl(var(--register-stamp-excused))]",
  holiday: "bg-[hsl(var(--register-stamp-holiday))] border-[hsl(var(--register-stamp-holiday))]",
};

function StatusStamp({ stamp }: { stamp: string }) {
  if (!stamp) return null;
  const color = STATUS_STAMP_COLORS[stamp] || "bg-muted border-muted";
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full border ${color}`} />
  );
}

export function EditDayDialog({
  open,
  onOpenChange,
  userId,
  date,
  morningStatus,
  afternoonStatus,
  morningRecordId,
  afternoonRecordId,
  onSuccess,
}: EditDayDialogProps) {
  const [morning, setMorning] = useState(morningStatus || "");
  const [afternoon, setAfternoon] = useState(afternoonStatus || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMorning(morningStatus || "");
    setAfternoon(afternoonStatus || "");
  }, [morningStatus, afternoonStatus, open]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (morning) {
        await manualMarkAttendance(userId, date, "morning", morning as any);
      } else if (morningRecordId) {
        await deleteAttendanceRecord(morningRecordId);
      }

      if (afternoon) {
        await manualMarkAttendance(userId, date, "afternoon", afternoon as any);
      } else if (afternoonRecordId) {
        await deleteAttendanceRecord(afternoonRecordId);
      }

      toast.success("Attendance updated");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Failed to update attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-register-heading">Edit Attendance</DialogTitle>
          <DialogDescription className="font-register-mono text-xs">{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-[hsl(var(--register-stamp-late))]" />
              <Label className="font-register-body text-sm font-medium">Morning Session</Label>
            </div>
            <Select value={morning} onValueChange={setMorning}>
              <SelectTrigger className="font-register-mono text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "clear"} value={opt.value || "clear"} className="font-register-mono text-xs">
                    <span className="flex items-center gap-2">
                      <StatusStamp stamp={opt.stamp} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sunset className="h-4 w-4 text-[hsl(var(--register-stamp-excused))]" />
              <Label className="font-register-body text-sm font-medium">Afternoon Session</Label>
            </div>
            <Select value={afternoon} onValueChange={setAfternoon}>
              <SelectTrigger className="font-register-mono text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "clear-afternoon"} value={opt.value || "clear-afternoon"} className="font-register-mono text-xs">
                    <span className="flex items-center gap-2">
                      <StatusStamp stamp={opt.stamp} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-register-mono text-xs">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="font-register-mono text-xs">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
