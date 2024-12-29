import React from "react";
import { useQuery } from "react-query";
import { getReflectionsByWeek } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function WeeklyReflections() {
  const { data: weeklyReflections, isLoading, error } = useQuery("weeklyReflections", getReflectionsByWeek);
  if (isLoading) return <div>Loading weekly reflections...</div>;
  if (error) return <div>Error loading weekly reflections</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Reflections</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Users in Panic Zone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyReflections?.map((week) => (
              <TableRow key={`${week._id.year}-${week._id.week}`}>
                <TableCell>{week._id.week}</TableCell>
                <TableCell>{week._id.year}</TableCell>
                <TableCell>{week.users.filter((user) => user.reflections.some((r) => r.reflection.barometer === "Panic Zone")).length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
