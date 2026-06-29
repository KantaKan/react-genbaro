"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { createHoliday, type Holiday } from "@/lib/api";
import { Calendar, CalendarRange } from "lucide-react";

interface CreateHolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  onSuccess?: (holiday: Holiday) => void;
}

export function CreateHolidayDialog({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
}: CreateHolidayDialogProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
  }, [open, selectedDate]);

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a holiday name");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setIsSubmitting(true);
    try {
      const holiday = await createHoliday(name, startDate, endDate, description);
      toast.success(`Holiday "${name}" created successfully`);
      resetForm();
      onOpenChange(false);
      onSuccess?.(holiday);
    } catch (error) {
      console.error("Error creating holiday:", error);
      toast.error("Failed to create holiday");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateRange = startDate !== endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-register-heading">
            {isDateRange ? (
              <>
                <CalendarRange className="h-5 w-5" />
                Mark Date Range as Holiday
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                Mark as Holiday
              </>
            )}
          </DialogTitle>
          <DialogDescription className="font-register-mono text-xs">
            {isDateRange
              ? `Mark ${startDate} to ${endDate} as a holiday or break.`
              : `Mark ${startDate} as a holiday or break.`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-register-body text-sm">Holiday Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Songkran Break, New Year"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="font-register-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="font-register-body text-sm">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="font-register-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="font-register-body text-sm">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="font-register-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-register-body text-sm">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this holiday..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
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
              disabled={isSubmitting}
              className="font-register-mono text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-register-mono text-xs">
              {isSubmitting ? "Creating..." : "Create Holiday"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
