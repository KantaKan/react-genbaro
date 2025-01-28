import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

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

export function AdminUsersTable({ users, isLoading }: AdminUsersTableProps) {
  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState(["First Name", "Last Name", "JSD Number", "Email", "Cohort", "Total Reflections", "Last Barometer"]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "First Name",
    direction: "ascending",
  });

  const toggleColumn = (column: string) => {
    setVisibleColumns((current) => (current.includes(column) ? current.filter((col) => col !== column) : [...current, column]));
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
            {["First Name", "Last Name", "JSD Number", "Email", "Cohort", "Total Reflections", "Last Barometer"].map((column) => (
              <DropdownMenuCheckboxItem key={column} className="capitalize" checked={visibleColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                {column}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
            <TableRow key={user._id} onClick={() => handleRowClick(user._id)} className="cursor-pointer hover:bg-gray-100">
              {visibleColumns.includes("First Name") && <TableCell className="text-center">{user.first_name}</TableCell>}
              {visibleColumns.includes("Last Name") && <TableCell className="text-center">{user.last_name}</TableCell>}
              {visibleColumns.includes("JSD Number") && <TableCell className="text-center">{user.jsd_number || "-"}</TableCell>}
              {visibleColumns.includes("Email") && <TableCell className="text-center">{user.email}</TableCell>}
              {visibleColumns.includes("Cohort") && <TableCell className="text-center">{user.cohort_number || "-"}</TableCell>}
              {visibleColumns.includes("Total Reflections") && <TableCell className="text-center">{getTotalReflections(user.reflections)}</TableCell>}
              {visibleColumns.includes("Last Barometer") && <TableCell className={`text-center ${getColorForBarometer(getLastBarometer(user.reflections))}`}>{getLastBarometer(user.reflections)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
