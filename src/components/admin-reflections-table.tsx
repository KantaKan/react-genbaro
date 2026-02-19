"use client";

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import FeedbackForm from "./feedback-form";
import { api } from "@/lib/api";
import { useConfig } from "@/hooks/use-config";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarometerVisual, reflectionZones } from "@/components/barometer-visual";

interface Reflection {
  _id: string;
  user_id?: string;
  FirstName: string;
  LastName: string;
  JsdNumber: string;
  Date: string;
  id?: string;
  Reflection: {
    Barometer: string;
    TechSessions?: {
      SessionName?: string[] | null;
      Happy?: string;
      Improve?: string;
    };
    NonTechSessions?: {
      SessionName?: string[] | null;
      Happy?: string;
      Improve?: string;
    };
  };
}

const LoadingRow = () => (
  <TableRow>
    <TableCell colSpan={99}>
      <div className="flex items-center justify-center p-8">
        <motion.div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
      </div>
    </TableCell>
  </TableRow>
);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() === 1) {
    return "No date";
  }
  return date.toLocaleDateString();
};

export default function AdminReflectionsTable() {
  const { config, updateAdminReflectionsSort, updateAdminReflectionsVisibleColumns } = useConfig();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Initialize state from config
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>(
    config.adminTables.reflections.sortConfig
  );

  // Convert hidden columns to visible columns for easier management
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    config.adminTables.reflections.visibleColumns
  );

  const [originalReflections, setOriginalReflections] = useState<Reflection[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const itemsPerPage = 20;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [barometerFilter, setBarometerFilter] = useState<string>("all");

  useEffect(() => {
    const fetchReflections = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/admin/reflections?page=${currentPage}&limit=${itemsPerPage}`);
        if (response.data.success && Array.isArray(response.data.data)) {
          const fetchedReflections = response.data.data;
          setOriginalReflections(fetchedReflections);
          setTotalPages(Math.ceil(response.data.total / itemsPerPage));
        } else {
          setOriginalReflections([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching reflections:", error);
        setOriginalReflections([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReflections();
  }, [currentPage]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const newVisibleColumns = prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId];

      // Update config with new visible columns
      updateAdminReflectionsVisibleColumns(newVisibleColumns);
      return newVisibleColumns;
    });
  };

  const getValueByKey = (reflection: Reflection, key: string) => {
    switch (key) {
      case "Date":
        return new Date(reflection.Date).getTime() || 0;
      case "FirstName":
        return reflection.FirstName || "";
      case "LastName":
        return reflection.LastName || "";
      case "JsdNumber":
        return reflection.JsdNumber || "";
      case "Barometer":
        return reflection.Reflection?.Barometer || "";
      default:
        return "";
    }
  };

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      const newDirection = prev.key === key && prev.direction === "ascending" ? "descending" : "ascending";

      // Update config with new sort settings
      const newSortConfig = { key, direction: newDirection };
      updateAdminReflectionsSort(key, newDirection);

      return newSortConfig;
    });
  };

  const handleSubmit = async (newReflection: Reflection) => {
    try {
      const response = await api.post(`users/${newReflection.user_id}/reflections`, newReflection);
      if (response.data) {
        const refreshResponse = await api.get(`/admin/reflections?page=${currentPage}&limit=${itemsPerPage}`);
        if (refreshResponse.data.success && Array.isArray(refreshResponse.data.data)) {
          setOriginalReflections(refreshResponse.data.data);
          setTotalPages(Math.ceil(refreshResponse.data.total / itemsPerPage));
        }
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error posting reflection:", error);
      throw error;
    }
  };

  const handleRowClick = (userId: string | undefined) => {
    if (!userId) return;
    navigate(`/admin/table/${userId}`);
  };

  const filteredReflections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = (r: Reflection) => {
      if (!query) return true;
      return (
        (r.FirstName || "").toLowerCase().includes(query) ||
        (r.LastName || "").toLowerCase().includes(query) ||
        (r.JsdNumber || "").toLowerCase().includes(query) ||
        (r.Reflection?.Barometer || "").toLowerCase().includes(query)
      );
    };

    const matchesBarometer = (r: Reflection) => {
      if (barometerFilter === "all") return true;
      return (r.Reflection?.Barometer || "") === barometerFilter;
    };

    const sorted = [...originalReflections]
      .filter((r) => matchesQuery(r) && matchesBarometer(r))
      .sort((a, b) => {
        const aValue = getValueByKey(a, sortConfig.key);
        const bValue = getValueByKey(b, sortConfig.key);

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });

    return sorted;
  }, [originalReflections, searchQuery, barometerFilter, sortConfig.key, sortConfig.direction]);

  const clamp2 =
    "overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]";

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="outline" disabled>
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Badge variant="outline" className="text-sm">
              Loading…
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input disabled placeholder="Search…" className="w-64 pl-8" />
            </div>
            <Button variant="outline" disabled className="w-48 justify-between">
              All Zones <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>JSD Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Barometer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <LoadingRow key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {["First Name", "Last Name", "JSD Number", "Date", "Tech Happy", "Tech Improve", "Non-Tech Happy", "Non-Tech Improve", "Barometer"].map((column) => (
                <DropdownMenuCheckboxItem key={column} className="capitalize" checked={visibleColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge variant="outline" className="text-sm">
            {filteredReflections.length} reflections
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name / JSD / zone…"
              value={searchQuery ?? ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <Select value={barometerFilter} onValueChange={setBarometerFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {reflectionZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.label}>
                  {zone.emoji} {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>{/* <Button variant="outline">Add Reflection</Button> */}</DialogTrigger>
          <DialogContent className="sm:max-w-[70vw] w-[70vw] h-[70vh] overflow-y-auto">
            <FeedbackForm onSubmit={handleSubmit} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              {visibleColumns.includes("First Name") && (
                <TableHead className="w-[140px] text-center">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("FirstName")}
                    className="w-full justify-center font-semibold"
                  >
                    First Name
                    {sortConfig.key === "FirstName" && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        {sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </motion.span>
                    )}
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("Last Name") && (
                <TableHead className="w-[140px] text-center">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("LastName")}
                    className="w-full justify-center font-semibold"
                  >
                    Last Name
                    {sortConfig.key === "LastName" && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        {sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </motion.span>
                    )}
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("JSD Number") && (
                <TableHead className="w-[130px] text-center">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("JsdNumber")}
                    className="w-full justify-center font-semibold"
                  >
                    JSD Number
                    {sortConfig.key === "JsdNumber" && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        {sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </motion.span>
                    )}
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("Date") && (
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("Date")}
                    className="w-full justify-start font-semibold"
                  >
                    Date
                    {sortConfig.key === "Date" && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        {sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </motion.span>
                    )}
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("Tech Happy") && <TableHead>Tech Happy</TableHead>}
              {visibleColumns.includes("Tech Improve") && <TableHead>Tech Improve</TableHead>}
              {visibleColumns.includes("Non-Tech Happy") && <TableHead>Non-Tech Happy</TableHead>}
              {visibleColumns.includes("Non-Tech Improve") && <TableHead>Non-Tech Improve</TableHead>}
              {visibleColumns.includes("Barometer") && (
                <TableHead className="w-[220px] text-center">Barometer</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredReflections.map((reflection, index) => (
                <motion.tr
                  key={
                    reflection._id ||
                    `reflection-${reflection.user_id || reflection.id || "unknown"}-${reflection.Date || "nodate"}-${index}`
                  }
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleRowClick(reflection.user_id || reflection.id)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {visibleColumns.includes("First Name") && (
                    <TableCell className="w-[140px] text-center">
                      {reflection.FirstName}
                    </TableCell>
                  )}
                  {visibleColumns.includes("Last Name") && (
                    <TableCell className="w-[140px] text-center">
                      {reflection.LastName}
                    </TableCell>
                  )}
                  {visibleColumns.includes("JSD Number") && (
                    <TableCell className="w-[130px] text-center font-mono">
                      {reflection.JsdNumber}
                    </TableCell>
                  )}
                  {visibleColumns.includes("Date") && (
                    <TableCell className="w-[120px]">
                      {formatDate(reflection.Date)}
                    </TableCell>
                  )}
                  {visibleColumns.includes("Tech Happy") && (
                    <TableCell className="align-top">
                      <div
                        className={`${clamp2} max-w-[520px] whitespace-pre-wrap break-words text-sm text-muted-foreground`}
                        title={reflection.Reflection?.TechSessions?.Happy || ""}
                      >
                        {reflection.Reflection?.TechSessions?.Happy || ""}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes("Tech Improve") && (
                    <TableCell className="align-top">
                      <div
                        className={`${clamp2} max-w-[520px] whitespace-pre-wrap break-words text-sm text-muted-foreground`}
                        title={reflection.Reflection?.TechSessions?.Improve || ""}
                      >
                        {reflection.Reflection?.TechSessions?.Improve || ""}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes("Non-Tech Happy") && (
                    <TableCell className="align-top">
                      <div
                        className={`${clamp2} max-w-[520px] whitespace-pre-wrap break-words text-sm text-muted-foreground`}
                        title={reflection.Reflection?.NonTechSessions?.Happy || ""}
                      >
                        {reflection.Reflection?.NonTechSessions?.Happy || ""}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes("Non-Tech Improve") && (
                    <TableCell className="align-top">
                      <div
                        className={`${clamp2} max-w-[520px] whitespace-pre-wrap break-words text-sm text-muted-foreground`}
                        title={reflection.Reflection?.NonTechSessions?.Improve || ""}
                      >
                        {reflection.Reflection?.NonTechSessions?.Improve || ""}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes("Barometer") && (
                    <TableCell className="w-[220px] text-center">
                      <BarometerVisual
                        barometer={reflection.Reflection?.Barometer || ""}
                        size="sm"
                      />
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
          </PaginationItem>

          {/* First page */}
          {currentPage > 3 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
              </PaginationItem>
              {currentPage > 4 && (
                <PaginationItem>
                  <PaginationLink className="cursor-default">...</PaginationLink>
                </PaginationItem>
              )}
            </>
          )}

          {/* Numbered pages */}
          {[...Array(totalPages)].map((_, i) => {
            const pageNumber = i + 1;
            // Show current page and 1 page before and after
            if (pageNumber === currentPage || pageNumber === currentPage - 1 || pageNumber === currentPage + 1) {
              return (
                <PaginationItem key={i}>
                  <PaginationLink onClick={() => setCurrentPage(pageNumber)} isActive={currentPage === pageNumber} className="min-w-[2.5rem] text-center">
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            return null;
          })}

          {/* Last page */}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && (
                <PaginationItem>
                  <PaginationLink className="cursor-default">...</PaginationLink>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
