"use client";

import { useState } from "react";
import { useQuery } from "react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingRow } from "@/components/loading-row";
import { historyService } from "@/lib/api";
import type { HistoryQuery } from "@/domain/types";

const LIMIT = 50;

const STATUS_COLOR = (status: number) => {
  if (status >= 500) return "text-destructive";
  if (status >= 400) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
};

export default function AdminHistoryPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filters: HistoryQuery = {
    page,
    limit: LIMIT,
    role: role === "all" ? undefined : role,
    method: method === "all" ? undefined : method,
    q: search.trim() || undefined,
  };

  const { data, isLoading } = useQuery(
    ["history", filters],
    () => historyService.getHistory(filters),
    { keepPreviousData: true }
  );

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const updateFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <Badge variant="outline" className="text-sm">
          {total} events
        </Badge>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search path…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-56"
          />
          <Select value={role} onValueChange={updateFilter(setRole)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="learner">Learner</SelectItem>
            </SelectContent>
          </Select>
          <Select value={method} onValueChange={updateFilter(setMethod)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead className="w-[180px]">Actor</TableHead>
              <TableHead className="w-[100px]">Role</TableHead>
              <TableHead className="w-[90px]">Method</TableHead>
              <TableHead>Path</TableHead>
              <TableHead className="w-[80px] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(8)].map((_, i) => <LoadingRow key={i} />)
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No activity recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                  </TableCell>
                  <TableCell>{log.actor_name}</TableCell>
                  <TableCell className="capitalize">{log.actor_role}</TableCell>
                  <TableCell className="font-mono text-xs">{log.method}</TableCell>
                  <TableCell className="font-mono text-xs break-all">{log.path}</TableCell>
                  <TableCell className={`text-right font-mono text-xs ${STATUS_COLOR(log.status)}`}>
                    {log.status}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink className="cursor-default min-w-[4rem] text-center">
              {page} / {totalPages}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              aria-disabled={page === totalPages}
              className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
