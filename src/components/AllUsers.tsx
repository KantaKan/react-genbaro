import React from "react";
import { useQuery } from "react-query";
import { getAllUsers } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

export function AllUsers() {
  const { data: response, isLoading, error } = useQuery("allUsers", getAllUsers);

  if (isLoading)
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonLoader height="30px" className="mb-2" />
          <SkeletonLoader height="30px" className="mb-2" />
          <SkeletonLoader height="30px" className="mb-2" />
        </CardContent>
      </Card>
    );

  if (error) return <div>Error loading users</div>;

  const users = response ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reflections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.first_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.reflections?.length || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
