"use client";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileSpreadsheet, MessageSquare, Award, Eye, Filter, Calendar, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { useConfig } from "@/hooks/use-config";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteUserById } from "@/lib/api";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  jsd_number: string;
  email: string;
  cohort_number: number;
  reflections: Array<{
    reflection: {
      barometer: string;
    };
  }> | null;
  zoom_name: string;
  project_group: string;
  genmate_group: string;
}

interface AdminUsersTableProps {
  users: User[];
  isLoading: boolean;
}

import { BarometerVisual, reflectionZones } from "@/components/barometer-visual";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { AwardBadgeBulkDialog } from "@/components/award-badge-bulk-dialog";
import { BulkAttendanceDialog } from "@/components/bulk-attendance-dialog";
import { LoadingRow } from "@/components/loading-row";
import { Checkbox } from "@/components/ui/checkbox";

// Define all available columns in their desired order
const ALL_COLUMNS = ["Zoom Name", "Project Group", "Genmate Group", "First Name", "Last Name", "JSD Number", "Email", "Cohort", "Total Reflections", "Last Barometer", "Actions"] as const;

export function AdminUsersTable({ users, isLoading }: AdminUsersTableProps) {
  const { config, updateAdminUsersSort, updateAdminUsersVisibleColumns } = useConfig();
  const navigate = useNavigate();

  // Initialize state from config
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    config.adminTables.users.visibleColumns
  );

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>(
    config.adminTables.users.sortConfig
  );

  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [barometerFilter, setBarometerFilter] = useState<string>("all");
  const [projectGroupFilter, setProjectGroupFilter] = useState<string>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkBadgeOpen, setBulkBadgeOpen] = useState(false);
  const [bulkAttendanceOpen, setBulkAttendanceOpen] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleColumn = (column: string) => {
    setVisibleColumns((current) => {
      let newColumns: string[];
      if (current.includes(column)) {
        newColumns = current.filter((col) => col !== column);
      } else {
        newColumns = [...current];
        const originalIndex = ALL_COLUMNS.indexOf(column as (typeof ALL_COLUMNS)[number]);
        let insertIndex = 0;
        for (let i = 0; i < originalIndex; i++) {
          if (newColumns.includes(ALL_COLUMNS[i])) {
            insertIndex = newColumns.indexOf(ALL_COLUMNS[i]) + 1;
          }
        }
        newColumns.splice(insertIndex, 0, column);
      }

      // Update config with new visible columns
      updateAdminUsersVisibleColumns(newColumns);
      return newColumns;
    });
  };

  const getLastBarometer = (reflections: User["reflections"]) => {
    if (!reflections || reflections.length === 0) return "-";
    return reflections[reflections.length - 1].reflection.barometer || "-";
  };

  const getTotalReflections = (reflections: User["reflections"]) => {
    return reflections?.length || 0;
  };

  const handleRowClick = (userId: string) => {
    navigate(`/admin/table/${userId}`);
  };

  const getValueByKey = (user: User, key: string) => {
    switch (key) {
      case "Zoom Name":
        return user.zoom_name;
      case "Project Group":
        return user.project_group;
      case "Genmate Group":
        return user.genmate_group;
      case "First Name":
        return user.first_name;
      case "Last Name":
        return user.last_name;
      case "JSD Number":
        return user.jsd_number;
      case "Email":
        return user.email;
      case "Cohort":
        return user.cohort_number;
      case "Total Reflections":
        return getTotalReflections(user.reflections);
      case "Last Barometer":
        return getLastBarometer(user.reflections);
      case "Actions":
        return "";
      default:
        return "";
    }
  };

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      const newDirection = prev.key === key && prev.direction === "ascending" ? "descending" : "ascending";

      // Update config with new sort settings
      updateAdminUsersSort(key, newDirection);

      return {
        key,
        direction: newDirection,
      };
    });
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = getValueByKey(a, sortConfig.key);
    const bValue = getValueByKey(b, sortConfig.key);

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter((user) => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.zoom_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.jsd_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBarometer = barometerFilter === "all" || getLastBarometer(user.reflections) === barometerFilter;
    const matchesProjectGroup = projectGroupFilter === "all" || user.project_group === projectGroupFilter;

    return matchesSearch && matchesBarometer && matchesProjectGroup;
  });

  const uniqueProjectGroups = Array.from(new Set(users.map(u => u.project_group).filter(Boolean)));

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u._id)));
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleBulkExport = async () => {
    setIsBulkExporting(true);
    const selectedUsers = users.filter(u => selectedUserIds.has(u._id));
    const csv = [
      ["First Name", "Last Name", "Email", "Zoom Name", "Project Group", "JSD Number", "Total Reflections", "Last Barometer"].join(","),
      ...selectedUsers.map(u => [
        u.first_name,
        u.last_name,
        u.email,
        u.zoom_name || "",
        u.project_group || "",
        u.jsd_number || "",
        getTotalReflections(u.reflections),
        getLastBarometer(u.reflections),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baro-users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsBulkExporting(false);
    setSelectedUserIds(new Set());
  };

  const handleQuickAction = (action: string, userId: string, user: User) => {
    if (action === "view") {
      navigate(`/admin/table/${userId}`);
    } else if (action === "message") {
      toast.info(`Message feature coming soon for ${user.first_name}`);
    } else if (action === "badge") {
      toast.info(`Badge award feature coming soon for ${user.first_name}`);
    } else if (action === "delete") {
      setDeleteUserId(userId);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setIsDeleting(true);
    try {
      await deleteUserById(deleteUserId);
      toast.success("User deleted successfully");
      setDeleteUserId(null);
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("https://mongodbtospreadsheet.onrender.com/export");
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        window.open(data.link, "_blank");
      } else {
        toast.error("Failed to export data.");
      }
    } catch (error) {
      toast.error("An error occurred while exporting data.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex justify-between mb-6 flex-wrap gap-4">
          <Button variant="outline" disabled>
            Columns <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Input placeholder="Search users..." disabled className="w-64" />
            <Button disabled>Export to Sheets</Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead key={column} className="text-center">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <LoadingRow key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const renderTableCell = (user: User, column: string) => {
    const value = getValueByKey(user, column);

    if (column === "Actions") {
      return (
        <TableCell key={column} className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("view", user._id, user); }} title="View Details">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/admin/attendance/student/${user._id}`); }} title="View Attendance">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("message", user._id, user); }} title="Send Message">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("badge", user._id, user); }} title="Award Badge">
              <Award className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("delete", user._id, user); }} title="Delete User" className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      );
    }

    // Add center alignment only for specific columns
    if (["First Name", "Last Name", "JSD Number", "Date"].includes(column)) {
      return (
        <TableCell key={column} className="text-center">
          {value || "-"}
        </TableCell>
      );
    }

    if (column === "Last Barometer") {
      return (
        <TableCell key={column} className="min-w-[100px]">
          <BarometerVisual barometer={value as string} variant="full" size="sm" />
        </TableCell>
      );
    }

    if (column === "Total Reflections") {
      return (
        <TableCell key={column}>
          <Badge variant="secondary" className="font-mono">
            {value}
          </Badge>
        </TableCell>
      );
    }

    return <TableCell key={column}>{value || "-"}</TableCell>;
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {ALL_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem key={column} className="capitalize" checked={visibleColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge variant="outline" className="text-sm">
            {filteredUsers.length} / {users.length} users
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <Select value={barometerFilter} onValueChange={setBarometerFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {reflectionZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.label}>{zone.emoji} {zone.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {uniqueProjectGroups.length > 0 && (
            <Select value={projectGroupFilter} onValueChange={setProjectGroupFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Project Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {uniqueProjectGroups.map((group) => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleExport} disabled={isExporting} variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {isExporting ? (
              <motion.div className="inline-flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
                Exporting...
              </motion.div>
            ) : (
              "Export to Sheets"
            )}
          </Button>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedUserIds.size}
        totalCount={filteredUsers.length}
        onClearSelection={() => setSelectedUserIds(new Set())}
        onBulkBadge={() => setBulkBadgeOpen(true)}
        onBulkAttendance={() => setBulkAttendanceOpen(true)}
        onBulkExport={handleBulkExport}
        isExporting={isBulkExporting}
      />

      {filteredUsers.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          No users found matching your filters. Try adjusting your search or filters.
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead key={column} className="text-center">
                  <Button variant="ghost" onClick={() => requestSort(column)} className="w-full justify-center font-bold">
                    {column}
                    {sortConfig.key === column && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        {sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4 inline" /> : <ChevronDown className="ml-2 h-4 w-4 inline" />}
                      </motion.span>
                    )}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleRowClick(user._id)}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors text-center even:bg-muted/25 ${selectedUserIds.has(user._id) ? "bg-primary/10" : ""}`}
                >
                  <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedUserIds.has(user._id)}
                      onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
                      aria-label={`Select ${user.first_name}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => renderTableCell(user, column))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <AwardBadgeBulkDialog
        isOpen={bulkBadgeOpen}
        onClose={() => setBulkBadgeOpen(false)}
        userIds={Array.from(selectedUserIds)}
        onSuccess={() => setSelectedUserIds(new Set())}
      />

      <BulkAttendanceDialog
        isOpen={bulkAttendanceOpen}
        onClose={() => setBulkAttendanceOpen(false)}
        userIds={Array.from(selectedUserIds)}
        onSuccess={() => setSelectedUserIds(new Set())}
      />

      <AlertDialog open={!!deleteUserId} onOpenChange={() => !isDeleting && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and all user data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-red-500 hover:bg-red-600">
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
