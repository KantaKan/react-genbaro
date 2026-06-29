"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { adminCreateLeaveRequest, type LeaveRequest, type AdminCreateLeaveRequestPayload } from "@/lib/api";
import { UserPlus, Clock, Sun, Sunset } from "lucide-react";

interface Student {
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
}

interface CreateLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  preselectedStudent?: Student;
  defaultDate?: string;
  onSuccess?: (request: LeaveRequest) => void;
}

const LEAVE_TYPES = [
  { value: "late", label: "Late Arrival", icon: Clock },
  { value: "half_day", label: "Half Day", icon: Sun },
  { value: "full_day", label: "Full Day", icon: Sunset },
];

const SESSIONS = [
  { value: "morning", label: "Morning (9:00 - 10:30)" },
  { value: "afternoon", label: "Afternoon (13:00 - 14:30)" },
];

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function CreateLeaveRequestDialog({
  open,
  onOpenChange,
  students,
  preselectedStudent,
  defaultDate,
  onSuccess,
}: CreateLeaveRequestDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [leaveType, setLeaveType] = useState<"late" | "half_day" | "full_day">("late");
  const [date, setDate] = useState<string>(defaultDate || getLocalDate());
  const [session, setSession] = useState<"morning" | "afternoon">("morning");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedStudent?.user_id) {
      setSelectedUserId(preselectedStudent.user_id);
    }
  }, [preselectedStudent]);

  const resetForm = () => {
    setSelectedUserId("");
    setLeaveType("late");
    setDate(getLocalDate());
    setSession("morning");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error("Please select a student");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AdminCreateLeaveRequestPayload = {
        user_id: selectedUserId,
        type: leaveType,
        date,
        session: leaveType === "half_day" ? session : undefined,
        reason: reason.trim(),
      };

      const result = await adminCreateLeaveRequest(payload);
      toast.success(`Leave request created for ${result.first_name} ${result.last_name}`);
      resetForm();
      onOpenChange(false);
      onSuccess?.(result);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Failed to create leave request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-register-heading">
            <UserPlus className="h-5 w-5" />
            Create Leave Request
          </DialogTitle>
          <DialogDescription className="font-register-body text-sm text-muted-foreground">
            Manually create a leave request for a learner. This will be auto-approved and the learner will be notified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student" className="font-register-body text-sm">Student</Label>
            {preselectedStudent ? (
              <div className="flex items-center gap-2 p-2 bg-muted rounded border border-register-border/30">
                <span className="font-register-mono text-xs">
                  {preselectedStudent.jsd_number} - {preselectedStudent.first_name} {preselectedStudent.last_name}
                </span>
              </div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="student" className="font-register-mono text-xs">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student, index) => (
                    <SelectItem key={student.user_id ?? `student-${index}`} value={student.user_id ?? ""} className="font-register-mono text-xs">
                      {student.jsd_number} - {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-type" className="font-register-body text-sm">Leave Type</Label>
            <Select
              value={leaveType}
              onValueChange={(v) => setLeaveType(v as "late" | "half_day" | "full_day")}
            >
              <SelectTrigger id="leave-type" className="font-register-mono text-xs">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value} className="font-register-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="font-register-body text-sm">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-register-mono text-xs"
            />
          </div>

          {leaveType === "half_day" && (
            <div className="space-y-2">
              <Label htmlFor="session" className="font-register-body text-sm">Session</Label>
              <Select
                value={session}
                onValueChange={(v) => setSession(v as "morning" | "afternoon")}
              >
                <SelectTrigger id="session" className="font-register-mono text-xs">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="font-register-mono text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason" className="font-register-body text-sm">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="font-register-mono text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="font-register-mono text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-register-mono text-xs">
              {isSubmitting ? "Creating..." : "Create & Approve"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
