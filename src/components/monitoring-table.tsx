"use client";

import * as React from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface BarometerData {
  Date: string;
  ComfortZone: number;
  PanicZone: number;
  StretchZoneEnjoyingTheChallenges: number;
  StretchZoneOverwhelmed: number;
  [key: string]: number | string; // For user-specific data
}

const columns = ["Comfort Zone", "Stretch Zone - Enjoying the Challenges", "Stretch Zone - Overwhelmed", "Panic Zone", ...users.map((user) => user.id)];

const getZoneColor = (zone: string) => {
  switch (zone.toLowerCase()) {
    case "comfort zone":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "stretch zone - enjoying the challenges":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "stretch zone - overwhelmed":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "panic zone":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

const UserHeader = ({ user }: { user: User }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium hidden lg:inline-block">{user.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user.id}</p>
          <p className="font-medium">{user.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function MonitoringTable({ data }: { data: BarometerData[] }) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[100px] font-bold">Date</TableHead>
            {columns.map((column, index) => (
              <TableHead key={index} className="font-bold">
                {users.find((u) => u.id === column) ? <UserHeader user={users.find((u) => u.id === column)!} /> : column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell className="font-medium whitespace-nowrap">{format(new Date(row.Date), "EEE dd/MMM/yy")}</TableCell>
              {columns.map((column, cellIndex) => {
                const value = row[column] || 0;
                const zone = column.includes("Stretch Zone") ? column : column.replace(" ", "");
                return (
                  <TableCell key={cellIndex} className="min-w-[100px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            {value > 0 && (
                              <Badge variant="secondary" className="w-12 justify-center">
                                {value}
                              </Badge>
                            )}
                            <Badge variant="secondary" className={cn("whitespace-nowrap", getZoneColor(zone))}>
                              {zone}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Value: {value}</p>
                          <p>Zone: {zone}</p>
                          {users[cellIndex - 4] && <p>User: {users[cellIndex - 4].name}</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
