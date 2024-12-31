import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "../lib/utils";

interface Reflection {
  id: number;
  date: string;
  comfortLevel: string;
  categories: string[];
}

interface ReflectionsTableProps {
  reflections: Reflection[];
}

export function ReflectionsTable({ reflections }: ReflectionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Comfort Level</TableHead>
          <TableHead>Categories</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reflections.map((reflection) => (
          <TableRow key={reflection.id}>
            <TableCell>{formatDate(new Date(reflection.date))}</TableCell>
            <TableCell>{reflection.comfortLevel}</TableCell>
            <TableCell>{reflection.categories.join(", ")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

