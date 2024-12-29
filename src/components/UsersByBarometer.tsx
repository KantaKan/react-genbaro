import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { getUsersByBarometer } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const barometerOptions = [
  'Comfort Zone',
  'Stretch Zone - Enjoying the Challenges',
  'Stretch Zone - Overwhelmed',
  'Panic Zone'
];

export function UsersByBarometer() {
  const [selectedBarometer, setSelectedBarometer] = useState(barometerOptions[0]);
  const { data: users, isLoading, error } = useQuery(['usersByBarometer', selectedBarometer], () => getUsersByBarometer(selectedBarometer));

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users by Barometer</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedBarometer} onValueChange={setSelectedBarometer}>
          <SelectTrigger className="w-[180px] mb-4">
            <SelectValue placeholder="Select barometer" />
          </SelectTrigger>
          <SelectContent>
            {barometerOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Reflections in {selectedBarometer}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.reflections.filter(r => r.reflection.barometer === selectedBarometer).length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

