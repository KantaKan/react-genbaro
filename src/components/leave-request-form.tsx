"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { submitLeaveRequest, type LeaveRequest, type CreateLeaveRequestPayload } from "@/lib/api";
import { CalendarClock, Clock, Sun, Sunset } from "lucide-react";

interface LeaveRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (request: LeaveRequest) => void;
}

const LEAVE_TYPES = [
  { value: "late", label: "Late Arrival", description: "Will arrive late to class", icon: Clock },
  { value: "half_day", label: "Half Day", description: "Will miss one session (AM or PM)", icon: Sun },
  { value: "full_day", label: "Full Day", description: "Will miss the entire day", icon: Sunset },
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

export function LeaveRequestForm({ open, onOpenChange, onSuccess }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<"late" | "half_day" | "full_day">("late");
  const [date, setDate] = useState(getLocalDate());
  const [session, setSession] = useState<"morning" | "afternoon">("morning");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setLeaveType("late");
    setDate(getLocalDate());
    setSession("morning");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason for your leave request");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLeaveRequestPayload = {
        type: leaveType,
        date,
        session: leaveType === "half_day" ? session : undefined,
        reason: reason.trim(),
      };

      const result = await submitLeaveRequest(payload);
      toast.success("Leave request submitted successfully!");
      resetForm();
      onOpenChange(false);
      onSuccess?.(result);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Failed to submit leave request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Request Leave
          </DialogTitle>
          <DialogDescription>
            Submit a leave request for admin approval. You'll be notified once it's reviewed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type</Label>
            <Select
              value={leaveType}
              onValueChange={(v) => setLeaveType(v as "late" | "half_day" | "full_day")}
            >
              <SelectTrigger id="leave-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({type.description})
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can request leave for past or future dates
            </p>
          </div>

          {leaveType === "half_day" && (
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select
                value={session}
                onValueChange={(v) => setSession(v as "morning" | "afternoon")}
              >
                <SelectTrigger id="session">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need this leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
