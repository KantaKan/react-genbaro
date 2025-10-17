export const reflectionZones = [
  { id: "comfort", label: "Comfort Zone", bgColor: "bg-green-500", textColor: "text-green-900", emoji: "😸" },
  {
    id: "stretch-enjoying",
    label: "Stretch zone - Enjoying the challenges",
    bgColor: "bg-yellow-500",
    textColor: "text-yellow-900",
    emoji: "😺",
  },
  { id: "stretch-overwhelmed", label: "Stretch zone - Overwhelmed", bgColor: "bg-red-500", textColor: "text-red-900", emoji: "😿" },
  { id: "panic", label: "Panic Zone", bgColor: "bg-purple-500", textColor: "text-purple-900", emoji: "🙀" },
] as const;

export type ReflectionZone = (typeof reflectionZones)[number];

export const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? `${zone.bgColor} ${zone.textColor}` : "";
};

export const calculateZoneStats = (reflections: any[]) => {
  const stats = {
    comfort: 0,
    stretchEnjoying: 0,
    stretchOverwhelmed: 0,
    panic: 0,
    total: reflections.length,
  };

  reflections.forEach((reflection) => {
    if (reflection?.reflection?.barometer) {
      const zone = reflectionZones.find((zone) => zone.label === reflection.reflection.barometer);
      if (zone) {
        if (zone.id === "comfort") stats.comfort++;
        if (zone.id === "stretch-enjoying") stats.stretchEnjoying++;
        if (zone.id === "stretch-overwhelmed") stats.stretchOverwhelmed++;
        if (zone.id === "panic") stats.panic++;
      }
    }
  });

  return stats;
};

export const findDominantZone = (stats: ReturnType<typeof calculateZoneStats>) => {
  const zoneCounts = [
    { id: "comfort", count: stats.comfort },
    { id: "stretch-enjoying", count: stats.stretchEnjoying },
    { id: "stretch-overwhelmed", count: stats.stretchOverwhelmed },
    { id: "panic", count: stats.panic },
  ];

  const sortedZones = zoneCounts.sort((a, b) => b.count - a.count);
  return sortedZones[0].id;
};
