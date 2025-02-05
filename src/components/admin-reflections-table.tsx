"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FeedbackForm from "./feedback-form";
import { api } from "@/lib/api";

interface Reflection {
  _id: string;
  user_id: string;
  FirstName: string;
  LastName: string;
  JsdNumber: string;
  Date: string;
  id: string;
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

const reflectionZones = [
  {
    id: "comfort",
    label: "Comfort Zone",
    bgColor: "bg-green-500",
    emoji: "😊",
    description: "Where you feel safe and in control. Tasks are easy and familiar.",
  },
  {
    id: "stretch-enjoying",
    label: "Stretch Zone - Enjoying the Challenges",
    bgColor: "bg-yellow-500",
    emoji: "🤔",
    description: "Pushing your boundaries, feeling challenged but excited.",
  },
  {
    id: "stretch-overwhelmed",
    label: "Stretch Zone - Overwhelmed",
    bgColor: "bg-orange-500",
    emoji: "😰",
    description: "Feeling stressed, but still learning and growing.",
  },
  {
    id: "panic",
    label: "Panic Zone",
    bgColor: "bg-red-500",
    emoji: "😱",
    description: "Feeling extreme stress or fear. Learning is difficult here.",
  },
  {
    id: "no-data",
    label: "No Data",
    bgColor: "bg-gray-200",
    emoji: "❌",
    description: "Insufficient information to categorize the experience.",
  },
];

const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? zone.bgColor : "";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() === 1) {
    return "No date";
  }
  return date.toLocaleDateString();
};

export default function AdminReflectionsTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "Date",
    direction: "descending",
  });
  const [originalReflections, setOriginalReflections] = useState<Reflection[]>([]);
  const [displayedReflections, setDisplayedReflections] = useState<Reflection[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchReflections = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/admin/reflections?page=${currentPage}&limit=${itemsPerPage}`);
        if (response.data.success && Array.isArray(response.data.data)) {
          const fetchedReflections = response.data.data;
          setOriginalReflections(fetchedReflections);

          // Apply current sorting to new data
          const sortedReflections = [...fetchedReflections].sort((a, b) => {
            const aValue = getValueByKey(a, sortConfig.key);
            const bValue = getValueByKey(b, sortConfig.key);

            if (typeof aValue === "string" && typeof bValue === "string") {
              return sortConfig.direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }

            if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
            return 0;
          });

          setDisplayedReflections(sortedReflections);
          setTotalPages(Math.ceil(response.data.total / itemsPerPage));
        } else {
          setOriginalReflections([]);
          setDisplayedReflections([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching reflections:", error);
        setOriginalReflections([]);
        setDisplayedReflections([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReflections();
  }, [currentPage, sortConfig.key, sortConfig.direction]);

  const toggleColumn = (columnId: string) => {
    setHiddenColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]));
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

      const sortedReflections = [...displayedReflections].sort((a, b) => {
        const aValue = getValueByKey(a, key);
        const bValue = getValueByKey(b, key);

        if (typeof aValue === "string" && typeof bValue === "string") {
          return newDirection === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return newDirection === "ascending" ? -1 : 1;
        if (aValue > bValue) return newDirection === "ascending" ? 1 : -1;
        return 0;
      });

      setDisplayedReflections(sortedReflections);

      return { key, direction: newDirection };
    });
  };

  const handleSubmit = async (newReflection: Reflection) => {
    try {
      const response = await api.post(`users/${newReflection.user_id}/reflections`, newReflection);
      if (response.data) {
        const refreshResponse = await api.get(`/admin/reflections?page=${currentPage}&limit=${itemsPerPage}`);
        if (refreshResponse.data.success && Array.isArray(refreshResponse.data.data)) {
          setOriginalReflections(refreshResponse.data.data);
          setDisplayedReflections(refreshResponse.data.data);
          setTotalPages(Math.ceil(refreshResponse.data.total / itemsPerPage));
        }
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error posting reflection:", error);
      throw error;
    }
  };

  const handleRowClick = (userId: string) => {
    navigate(`/admin/table/${userId}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["First Name", "Last Name", "JSD Number", "Date", "Tech Happy", "Tech Improve", "Non-Tech Happy", "Non-Tech Improve", "Barometer"].map((column) => (
              <DropdownMenuCheckboxItem key={column} className="capitalize" checked={!hiddenColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                {column}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>{/* <Button variant="outline">Add Reflection</Button> */}</DialogTrigger>
          <DialogContent className="sm:max-w-[70vw] w-[70vw] h-[70vh] overflow-y-auto">
            <FeedbackForm onSubmit={handleSubmit} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {!hiddenColumns.includes("First Name") && (
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("FirstName")}>
                  First Name
                  {sortConfig.key === "FirstName" && (sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
            )}
            {!hiddenColumns.includes("Last Name") && (
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("LastName")}>
                  Last Name
                  {sortConfig.key === "LastName" && (sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
            )}
            {!hiddenColumns.includes("JSD Number") && (
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("JsdNumber")}>
                  JSD Number
                  {sortConfig.key === "JsdNumber" && (sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
            )}
            {!hiddenColumns.includes("Date") && (
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("Date")}>
                  Date
                  {sortConfig.key === "Date" && (sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
            )}
            {!hiddenColumns.includes("Tech Happy") && <TableHead>Tech Happy</TableHead>}
            {!hiddenColumns.includes("Tech Improve") && <TableHead>Tech Improve</TableHead>}
            {!hiddenColumns.includes("Non-Tech Happy") && <TableHead>Non-Tech Happy</TableHead>}
            {!hiddenColumns.includes("Non-Tech Improve") && <TableHead>Non-Tech Improve</TableHead>}
            {!hiddenColumns.includes("Barometer") && <TableHead>Barometer</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedReflections.map((reflection) => (
            <TableRow key={reflection.id} onClick={() => handleRowClick(reflection.id)}>
              {!hiddenColumns.includes("First Name") && <TableCell>{reflection.FirstName}</TableCell>}
              {!hiddenColumns.includes("Last Name") && <TableCell>{reflection.LastName}</TableCell>}
              {!hiddenColumns.includes("JSD Number") && <TableCell>{reflection.JsdNumber}</TableCell>}
              {!hiddenColumns.includes("Date") && <TableCell>{formatDate(reflection.Date)}</TableCell>}
              {!hiddenColumns.includes("Tech Happy") && <TableCell>{reflection.Reflection?.TechSessions?.Happy || ""}</TableCell>}
              {!hiddenColumns.includes("Tech Improve") && <TableCell>{reflection.Reflection?.TechSessions?.Improve || ""}</TableCell>}
              {!hiddenColumns.includes("Non-Tech Happy") && <TableCell>{reflection.Reflection?.NonTechSessions?.Happy || ""}</TableCell>}
              {!hiddenColumns.includes("Non-Tech Improve") && <TableCell>{reflection.Reflection?.NonTechSessions?.Improve || ""}</TableCell>}
              {!hiddenColumns.includes("Barometer") && <TableCell className={getColorForBarometer(reflection.Reflection?.Barometer || "")}>{reflection.Reflection?.Barometer || ""}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
