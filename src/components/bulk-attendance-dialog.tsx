"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Users, Check, Clock, XCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BulkAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userIds: string[];
  onSuccess?: () => void;
}

type AttendanceStatus = "present" | "late" | "absent" | "excused";

const statusOptions: { value: AttendanceStatus; label: string; emoji: string; color: string; description: string }[] = [
  { value: "present", label: "Present", emoji: "✅", color: "text-green-600", description: "Mark as attended" },
  { value: "late", label: "Late", emoji: "⏰", color: "text-yellow-600", description: "Arrived late" },
  { value: "absent", label: "Absent", emoji: "❌", color: "text-red-600", description: "Did not attend" },
  { value: "excused", label: "Excused", emoji: "📋", color: "text-blue-600", description: "Excused absence" },
];

export function BulkAttendanceDialog({ isOpen, onClose, userIds, onSuccess }: BulkAttendanceDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error("Please select an attendance status.");
      return;
    }

    setIsSubmitting(true);
    setProgress({ current: 0, total: userIds.length });

    let successCount = 0;
    let failCount = 0;

    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < userIds.length; i++) {
      try {
        await api.patch(`/admin/attendance/${userIds[i]}`, {
          date: today,
          status: selectedStatus,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to update attendance for user ${userIds[i]}:`, error);
        failCount++;
      }
      setProgress({ current: i + 1, total: userIds.length });
    }

    setIsSubmitting(false);
    setResults({ success: successCount, failed: failCount });

    if (successCount > 0) {
      toast.success(`Updated attendance for ${successCount} learner${successCount !== 1 ? "s" : ""}`);
      if (failCount > 0) {
        toast.warning(`Failed to update ${failCount} learner${failCount !== 1 ? "s" : ""}`);
      }
    } else {
      toast.error("Failed to update attendance for any learners.");
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setResults(null);
    setProgress({ current: 0, total: 0 });
    onClose();
  };

  const handleSuccess = () => {
    onSuccess?.();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bulk Mark Attendance
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Marking <span className="font-semibold text-foreground">{userIds.length}</span> learner{userIds.length !== 1 ? "s" : ""} for today
          </div>
        </DialogHeader>

        {!results ? (
          <>
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select attendance status:</Label>
              <RadioGroup
                value={selectedStatus || ""}
                onValueChange={(v) => setSelectedStatus(v as AttendanceStatus)}
                className="grid gap-3"
              >
                {statusOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                      selectedStatus === option.value ? "border-primary bg-primary/10" : ""
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <span className="text-2xl">{option.emoji}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${option.color}`}>{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                    {selectedStatus === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary"
                      >
                        <Check className="h-5 w-5" />
                      </motion.div>
                    )}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {isSubmitting && (
              <div className="p-4 border rounded-lg bg-primary/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Updating attendance...
                  </span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedStatus || isSubmitting || userIds.length === 0}
              >
                {isSubmitting ? "Updating..." : `Mark ${userIds.length} Learner${userIds.length !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-6 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                {results.success > 0 ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Attendance Updated!</h3>
                      <p className="text-muted-foreground">
                        {results.success} learner{results.success !== 1 ? "s" : ""} updated
                        {results.failed > 0 && `, ${results.failed} failed`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Update Failed</h3>
                      <p className="text-muted-foreground">No learners were updated</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <DialogFooter>
              <Button onClick={handleSuccess} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
