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
  { value: "present", label: "Present", color: "text-green-600" },
  { value: "late", label: "Late", color: "text-yellow-600" },
  { value: "absent", label: "Absent", color: "text-red-600" },
  { value: "late_excused", label: "Late (Excused)", color: "text-blue-600" },
  { value: "absent_excused", label: "Absent (Excused)", color: "text-gray-600" },
  { value: "", label: "Clear / Unset", color: "text-muted-foreground" },
];

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
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-orange-500" />
              <Label>Morning Session</Label>
            </div>
            <Select value={morning} onValueChange={setMorning}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "clear"} value={opt.value || "clear"}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sunset className="h-4 w-4 text-purple-500" />
              <Label>Afternoon Session</Label>
            </div>
            <Select value={afternoon} onValueChange={setAfternoon}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "clear-afternoon"} value={opt.value || "clear-afternoon"}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
