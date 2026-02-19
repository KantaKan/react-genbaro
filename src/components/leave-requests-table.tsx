"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getTypeBadge = (type: string, session?: string) => {
  const types: Record<string, { icon: typeof Clock; label: string; color: string }> = {
    late: { icon: Clock, label: "Late", color: "bg-blue-500" },
    half_day: { icon: Sun, label: "Half Day", color: "bg-orange-500" },
    full_day: { icon: Sunset, label: "Full Day", color: "bg-purple-500" },
  };

  const typeInfo = types[type] || { icon: Clock, label: type, color: "bg-gray-500" };
  const Icon = typeInfo.icon;

  return (
    <Badge className={`${typeInfo.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {typeInfo.label}
      {session && <span className="text-xs">({session === "morning" ? "AM" : "PM"})</span>}
    </Badge>
  );
};

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
          <h2 className="text-2xl font-bold tracking-tight">Leave Requests</h2>
          <p className="text-muted-foreground">Review and manage learner leave requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCohort} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {COHORTS.map((c) => (
                <SelectItem key={c} value={c.toString()}>
                  Cohort {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadRequests}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No leave requests found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>JSD</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests || []).map((request) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-medium">{request.jsd_number}</TableCell>
                    <TableCell>
                      {request.first_name} {request.last_name}
                      {request.is_manual_entry && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Manual
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(request.type, request.session)}</TableCell>
                    <TableCell>
                      {new Date(request.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={request.reason}>
                      {request.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openReviewDialog(request, "approved")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openReviewDialog(request, "rejected")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {request.reviewed_by_name && (
                            <span>by {request.reviewed_by_name}</span>
                          )}
                          {request.review_notes && (
                            <div className="flex items-center gap-1 mt-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="truncate max-w-[100px]" title={request.review_notes}>
                                {request.review_notes}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <DialogTitle>
              {reviewAction === "approved" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span>
                  {selectedRequest.first_name} {selectedRequest.last_name} -{" "}
                  {getTypeBadge(selectedRequest.type, selectedRequest.session)} on{" "}
                  {new Date(selectedRequest.date).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Reason provided:</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.reason}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-notes">
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === "approved" ? "default" : "destructive"}
              onClick={handleReview}
              disabled={isSubmitting}
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
