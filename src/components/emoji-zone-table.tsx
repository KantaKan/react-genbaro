import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "../lib/api";

type Zone = "comfort" | "stretch-enjoying" | "stretch-overwhelmed" | "panic" | "no-data";

const zones = [
  {
    id: "comfort",
    label: "Comfort Zone",
    bgColor: "bg-green-500",
    emoji: "😊",
    description: "Where you feel safe and in control. Tasks are easy and familiar.",
  },
  {
    id: "stretch-enjoying",
    label: "Stretch zone - Enjoying the challenges",
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

interface Entry {
  date: string;
  zone: Zone;
}

interface TableData {
  zoomname: string;
  entries: Entry[] | null;
}

interface ApiResponse {
  status: string;
  message: string;
  data: TableData[];
}

const zoneToEmoji: Record<Zone, { emoji: string; className: string }> = zones.reduce((acc, zone) => {
  acc[zone.id as Zone] = { emoji: zone.emoji, className: zone.bgColor };
  return acc;
}, {} as Record<Zone, { emoji: string; className: string }>);

export default function EmojiZoneTable() {
  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const axiosResponse = await api.get("/admin/emoji-zone-table");
      const response: ApiResponse = axiosResponse.data;

      if (response.status === "success") {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch data");
      }
    } catch (err) {
      setError("An error occurred while fetching data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const validUsers = data.filter((user) => user.zoomname);
  const sortedUsers = [...validUsers].sort((a, b) => {
    const aNum = parseInt(a.zoomname.split("_")[0], 10);
    const bNum = parseInt(b.zoomname.split("_")[0], 10);
    return aNum - bNum;
  });

  const allDates = Array.from(new Set(data.flatMap((user) => (user.entries || []).map((entry) => entry.date)))).sort();
  const validDates = allDates.filter((date) => date !== "0001-01-01").sort();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data.length || !validUsers.length) {
    return (
      <Alert>
        <AlertDescription>No data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Emoji Zone Tracking</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 w-full min-w-32 h-12 font-medium border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">User Input Day</TableHead>
              {sortedUsers.map((user) => (
                <TableHead key={user.zoomname} className="w-32 max-w-[85px] h-12 text-center border-r overflow-hidden text-ellipsis whitespace-nowrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>{user.zoomname}</TooltipTrigger>
                      <TooltipContent>
                        <p>{user.zoomname}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {validDates.map((date) => (
              <TableRow key={date}>
                <TableCell className="sticky left-0 z-10 w-full min-w-32 h-12 font-medium border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{date}</TableCell>
                {sortedUsers.map((user) => {
                  const entry = user.entries?.find((e) => e.date === date);
                  const zoneData = entry ? zoneToEmoji[entry.zone] : zoneToEmoji["no-data"];
                  return (
                    <TableCell key={`${date}-${user.zoomname}`} className={`w-32 max-w-[85px] h-12 text-center border-r overflow-hidden text-ellipsis whitespace-nowrap ${zoneData.className}`}>
                      <span role="img" aria-label={`${entry?.zone || "no-data"} zone`} className="text-lg" title={`${user.zoomname}: ${zones.find((z) => z.id === entry?.zone)?.label || "No Data"}`}>
                        {zoneData.emoji}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
