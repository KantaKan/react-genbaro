import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const reflectionZones = [
  { id: "comfort", label: "Comfort Zone", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  { id: "stretch-enjoying", label: "Stretch zone - Enjoying the challenges", color: "text-amber-700", bgColor: "bg-amber-100" },
  { id: "stretch-overwhelmed", label: "Stretch zone - Overwhelmed", color: "text-orange-700", bgColor: "bg-orange-100" },
  { id: "panic", label: "Panic Zone", color: "text-rose-700", bgColor: "bg-rose-100" },
];

const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? `${zone.color} ${zone.bgColor}` : "";
};

// Define all available columns in their desired order
const ALL_COLUMNS = ["Zoom Name", "Project Group", "Genmate Group", "First Name", "Last Name", "JSD Number", "Email", "Cohort", "Total Reflections", "Last Barometer"] as const;

export function AdminUsersTable({ users, isLoading }: AdminUsersTableProps) {
  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState([...ALL_COLUMNS]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "Zoom Name",
    direction: "ascending",
  });

  const toggleColumn = (column: string) => {
    setVisibleColumns((current) => {
      if (current.includes(column)) {
        // Remove the column
        return current.filter((col) => col !== column);
      } else {
        // Add the column back in its original position
        const newColumns = [...current];
        const originalIndex = ALL_COLUMNS.indexOf(column as (typeof ALL_COLUMNS)[number]);

        // Find the correct insertion point
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

  // New function to handle export
  const handleExport = async () => {
    try {
      const response = await fetch("https://mongodbtospreadsheet.onrender.com/export"); // Replace with your actual API endpoint
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        toast.success(data.message); // Show success message
        window.open(data.link, "_blank"); // Open the link in a new tab
      } else {
        toast.error("Failed to export data."); // Show error message
      }
    } catch (error) {
      toast.error("An error occurred while exporting data."); // Show error message
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const renderTableCell = (user: User, column: string) => {
    const value = getValueByKey(user, column);
    const colorClass = column === "Last Barometer" ? getColorForBarometer(value as string) : "";

    return (
      <TableCell key={column} className={`text-center ${colorClass}`}>
        {value || "-"}
      </TableCell>
    );
  };

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
            {ALL_COLUMNS.map((column) => (
              <DropdownMenuCheckboxItem key={column} className="capitalize" checked={visibleColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                {column}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleExport}>Export to Google Sheets</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column} className="text-center">
                <Button variant="ghost" onClick={() => requestSort(column)} className="w-full justify-center font-bold">
                  {column}
                  {sortConfig.key === column && (sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4 inline" /> : <ChevronDown className="ml-2 h-4 w-4 inline" />)}
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow key={user._id} onClick={() => handleRowClick(user._id)}>
              {visibleColumns.map((column) => renderTableCell(user, column))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
