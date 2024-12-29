import React from "react";
import { useQuery } from "react-query";
import { getAllUsers } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AllUsers() {
  const { data: response, isLoading, error } = useQuery("allUsers", getAllUsers);

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users</div>;

  const users = response?.data; // Access the `data` property here

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
      </CardHeader>
      <CardContent>
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
                <TableCell>{user.reflections?.length || 0}</TableCell> {/* Safe check */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
