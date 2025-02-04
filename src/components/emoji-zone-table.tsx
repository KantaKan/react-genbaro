"use client";

import { useState, useEffect } from "react";
import { cd } from "../lib/utils";
import { api } from "../lib/api";

type Zone = "comfort" | "stretch-enjoying" | "stretch-overwhelmed" | "panic" | "no-data";

const zones = [
  { id: "comfort", label: "Comfort Zone", bgColor: "bg-green-500", emoji: "😊" },
  { id: "stretch-enjoying", label: "Stretch zone - Enjoying the challenges", bgColor: "bg-yellow-500", emoji: "🤔" },
  { id: "stretch-overwhelmed", label: "Stretch zone - Overwhelmed", bgColor: "bg-red-500", emoji: "😰" },
  { id: "panic", label: "Panic Zone", bgColor: "bg-purple-500", emoji: "😱" },
  { id: "no-data", label: "No Data", bgColor: "bg-gray-200", emoji: "❌" },
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
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

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

  // Get all unique dates from all entries
  const allDates = Array.from(new Set(data.flatMap((user) => (user.entries || []).map((entry) => entry.date)))).sort();

  // Filter out invalid dates and sort them
  const validDates = allDates.filter((date) => date !== "0001-01-01").sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-[200px] text-red-500">Error: {error}</div>;
  }

  if (!data.length) {
    return <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">No data available</div>;
  }

  return (
    <div className="w-full overflow-auto border rounded-lg">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-20 px-2 py-2 font-semibold text-left bg-gray-50 border-b">day</th>
            {data.map((user, index) => (
              <th key={index} className="px-2 py-2 font-semibold text-center border-b whitespace-nowrap min-w-[100px]">
                {user.zoomname || `User ${index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {validDates.map((date, rowIndex) => (
            <tr key={date} className={cd("transition-colors", hoveredRow === rowIndex ? "bg-gray-50" : "bg-white")} onMouseEnter={() => setHoveredRow(rowIndex)} onMouseLeave={() => setHoveredRow(null)}>
              <td className="sticky left-0 z-10 px-2 py-2 font-medium border-b whitespace-nowrap bg-inherit">{date}</td>
              {data.map((user, colIndex) => {
                const entry = user.entries?.find((e) => e.date === date);
                const zoneData = entry ? zoneToEmoji[entry.zone] : zoneToEmoji["no-data"];
                return (
                  <td key={`${date}-${colIndex}`} className={cd("px-2 py-2 text-center border-b transition-colors", zoneData.className, hoveredRow === rowIndex ? "bg-opacity-80" : "")}>
                    <span role="img" aria-label={`${entry?.zone || "no-data"} zone`} className="text-lg" title={`${user.zoomname || `User ${colIndex + 1}`}: ${zones.find((z) => z.id === entry?.zone)?.label || "No Data"}`}>
                      {zoneData.emoji}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
