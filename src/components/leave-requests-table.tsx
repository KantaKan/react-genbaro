"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { SkeletonTable, SkeletonWarm } from "@/components/loading-skeleton";
import {
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  getCohort,
  type LeaveRequest,
  type User,
} from "@/lib/api";
import { CreateLeaveRequestDialog } from "./create-leave-request-dialog";
import { Check, X, Plus, RefreshCw, Clock, Sun, Sunset, MessageSquare } from "lucide-react";

interface LeaveRequestsTableProps {
  cohort?: string;
}

const COHORTS = Array.from({ length: 12 }, (_, i) => i + 7);

const STATUS_COLORS: Record<string, string> = {
  approved: "hsl(var(--register-stamp-present))",
  pending: "hsl(var(--register-stamp-late))",
  rejected: "hsl(var(--register-stamp-absent))",
};

function StatusStamp({ status, label }: { status: string; label: string }) {
  const color = STATUS_COLORS[status] || "var(--register-ink)";
  return (
    <span
      className="font-register-mono text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1"
      style={{ color: `hsl(${color})`, borderColor: `hsl(${color} / 0.3)`, backgroundColor: `hsl(${color} / 0.08)` }}
    >
      {label}
    </span>
  );
}

const TYPE_CONFIG: Record<string, { icon: typeof Clock; label: string }> = {
  late: { icon: Clock, label: "Late" },
  half_day: { icon: Sun, label: "Half Day" },
  full_day: { icon: Sunset, label: "Full Day" },
};

function TypeBadge({ type, session }: { type: string; session?: string }) {
  const config = TYPE_CONFIG[type] || { icon: Clock, label: type };
  const Icon = config.icon;
  return (
    <span className="font-register-mono text-xs px-2 py-0.5 rounded border border-register-border/40 bg-muted/30 inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
      {session && <span className="text-[10px]">({session === "morning" ? "AM" : "PM"})</span>}
    </span>
  );
}

export function LeaveRequestsTable({ cohort }: LeaveRequestsTableProps) {
  const [selectedCohort, setSelectedCohort] = useState<string>(cohort || "11");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedCohort = localStorage.getItem("attendance_cohort");
    if (savedCohort) {
      setSelectedCohort(savedCohort);
    } else if (cohort) {
      setSelectedCohort(cohort);
    }
  }, [cohort]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { cohort?: number; status?: string } = {};
      if (selectedCohort !== "all") {
        params.cohort = parseInt(selectedCohort);
      }
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      const data = await getAllLeaveRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading leave requests:", error);
      toast.error("Failed to load leave requests");
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCohort, selectedStatus]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (selectedCohort !== "all") {
      getCohort(selectedCohort).then(setStudents).catch(console.error);
    }
  }, [selectedCohort]);

  const handleCohortChange = (value: string) => {
    setSelectedCohort(value);
    localStorage.setItem("attendance_cohort", value);
  };

  const openReviewDialog = (request: LeaveRequest, action: "approved" | "rejected") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setReviewDialogOpen(true);
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    if (reviewAction === "rejected" && !reviewNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateLeaveRequestStatus(selectedRequest._id, reviewAction, reviewNotes);
      toast.success(`Request ${reviewAction} successfully`);
      setReviewDialogOpen(false);
      loadRequests();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Failed to update request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;
  const approvedCount = requests?.filter((r) => r.status === "approved").length || 0;
  const rejectedCount = requests?.filter((r) => r.status === "rejected").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-register-heading text-2xl">Leave Requests</h2>
          <p className="font-register-body text-sm text-muted-foreground">Review and manage learner leave requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[130px] font-register-mono text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-register-mono text-xs">All Status</SelectItem>
              <SelectItem value="pending" className="font-register-mono text-xs">Pending</SelectItem>
              <SelectItem value="approved" className="font-register-mono text-xs">Approved</SelectItem>
              <SelectItem value="rejected" className="font-register-mono text-xs">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCohort} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-[130px] font-register-mono text-xs">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-register-mono text-xs">All Cohorts</SelectItem>
              {COHORTS.map((c) => (
                <SelectItem key={c} value={c.toString()} className="font-register-mono text-xs">
                  Cohort {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadRequests} className="border-register-border/40">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="font-register-mono text-xs">
            <Plus className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[hsl(var(--register-stamp-late))]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-register-body text-sm text-muted-foreground">Pending</p>
                <p className="font-register-mono text-3xl font-bold" style={{ color: `hsl(var(--register-stamp-late))` }}>{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 opacity-40" style={{ color: `hsl(var(--register-stamp-late))` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[hsl(var(--register-stamp-present))]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-register-body text-sm text-muted-foreground">Approved</p>
                <p className="font-register-mono text-3xl font-bold" style={{ color: `hsl(var(--register-stamp-present))` }}>{approvedCount}</p>
              </div>
              <Check className="h-8 w-8 opacity-40" style={{ color: `hsl(var(--register-stamp-present))` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[hsl(var(--register-stamp-absent))]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-register-body text-sm text-muted-foreground">Rejected</p>
                <p className="font-register-mono text-3xl font-bold" style={{ color: `hsl(var(--register-stamp-absent))` }}>{rejectedCount}</p>
              </div>
              <X className="h-8 w-8 opacity-40" style={{ color: `hsl(var(--register-stamp-absent))` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <SkeletonWarm key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <SkeletonTable rows={5} cols={7} />
            </>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-register-body">No leave requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-register-border/20">
                    <th className="font-register-mono text-xs text-left py-2 px-3 text-muted-foreground uppercase tracking-wider">JSD</th>
                    <th className="font-register-mono text-xs text-left py-2 px-3 text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="font-register-mono text-xs text-left py-2 px-3 text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="font-register-mono text-xs text-left py-2 px-3 text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="font-register-mono text-xs text-left py-2 px-3 text-muted-foreground uppercase tracking-wider">Reason</th>
                    <th className="font-register-mono text-xs text-left py-2 px-3 text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="font-register-mono text-xs text-right py-2 px-3 text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(requests || []).map((request) => (
                    <tr key={request._id} className="border-b border-register-border/10 hover:bg-muted/20 transition-colors">
                      <td className="font-register-mono text-xs py-2 px-3">{request.jsd_number}</td>
                      <td className="font-register-body text-sm py-2 px-3">
                        {request.first_name} {request.last_name}
                        {request.is_manual_entry && (
                          <span className="font-register-mono text-[10px] ml-1.5 px-1.5 py-0.5 rounded border border-register-border/30 bg-muted/30 text-muted-foreground">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3"><TypeBadge type={request.type} session={request.session} /></td>
                      <td className="font-register-mono text-xs py-2 px-3">
                        {new Date(request.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="font-register-body text-xs py-2 px-3 max-w-[200px] truncate" title={request.reason}>
                        {request.reason}
                      </td>
                      <td className="py-2 px-3">
                        <StatusStamp status={request.status} label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} />
                      </td>
                      <td className="py-2 px-3 text-right">
                        {request.status === "pending" ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              style={{ color: `hsl(var(--register-stamp-present))` }}
                              onClick={() => openReviewDialog(request, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              style={{ color: `hsl(var(--register-stamp-absent))` }}
                              onClick={() => openReviewDialog(request, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="font-register-mono text-[10px] text-muted-foreground">
                            {request.reviewed_by_name && (
                              <span>by {request.reviewed_by_name}</span>
                            )}
                            {request.review_notes && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MessageSquare className="h-3 w-3" />
                                <span className="truncate max-w-[100px]" title={request.review_notes}>
                                  {request.review_notes}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateLeaveRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        students={students}
        onSuccess={() => {
          loadRequests();
        }}
      />

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-register-heading">
              {reviewAction === "approved" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription className="font-register-mono text-xs">
              {selectedRequest && (
                <span>
                  {selectedRequest.first_name} {selectedRequest.last_name} on{" "}
                  {new Date(selectedRequest.date).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
            {selectedRequest && (
              <div className="mt-2">
                <TypeBadge type={selectedRequest.type} session={selectedRequest.session} />
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded border border-register-border/30 bg-muted/20">
              <p className="font-register-body text-sm font-medium mb-1">Reason provided:</p>
              <p className="font-register-mono text-xs text-muted-foreground">{selectedRequest?.reason}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-notes" className="font-register-body text-sm">
                {reviewAction === "rejected" ? "Rejection reason (required)" : "Notes (optional)"}
              </Label>
              <Textarea
                id="review-notes"
                placeholder={
                  reviewAction === "rejected"
                    ? "Please explain why this request is rejected..."
                    : "Add any notes..."
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="font-register-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="font-register-mono text-xs">
              Cancel
            </Button>
            <Button
              variant={reviewAction === "approved" ? "default" : "destructive"}
              onClick={handleReview}
              disabled={isSubmitting}
              className="font-register-mono text-xs"
            >
              {isSubmitting
                ? "Processing..."
                : reviewAction === "approved"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
