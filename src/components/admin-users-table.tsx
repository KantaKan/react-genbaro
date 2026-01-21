"use client";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";

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

import { LoadingRow } from "@/components/loading-row";

// Define all available columns in their desired order
const ALL_COLUMNS = ["Zoom Name", "Project Group", "Genmate Group", "First Name", "Last Name", "JSD Number", "Email", "Cohort", "Total Reflections", "Last Barometer"] as const;

export function AdminUsersTable({ users, isLoading }: AdminUsersTableProps) {
  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState([...ALL_COLUMNS]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "Zoom Name",
    direction: "ascending",
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleColumn = (column: string) => {
    setVisibleColumns((current) => {
      if (current.includes(column)) {
        return current.filter((col) => col !== column);
      } else {
        const newColumns = [...current];
        const originalIndex = ALL_COLUMNS.indexOf(column as (typeof ALL_COLUMNS)[number]);
        let insertIndex = 0;
        for (let i = 0; i < originalIndex; i++) {
          if (newColumns.includes(ALL_COLUMNS[i])) {
            insertIndex = newColumns.indexOf(ALL_COLUMNS[i]) + 1;
          }
        }
        newColumns.splice(insertIndex, 0, column);
        return newColumns;
      }
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
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }));
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
      <div className="container mx-auto py-10">
        <div className="flex justify-between mb-6">
          <Button variant="outline" disabled>
            Columns <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button disabled>Export to Google Sheets</Button>
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
          <Button variant="outline" size="sm" onClick={() => handleRowClick(user._id)}>
            View Details
          </Button>
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
        <TableCell key={column}>
          <BarometerVisual barometer={value as string} />
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
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
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
            {users.length} users
          </Badge>
        </div>
        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
            <AnimatePresence mode="wait">
              {sortedUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleRowClick(user._id)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors text-center even:bg-muted/25"
                >
                  {visibleColumns.map((column) => renderTableCell(user, column))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
