import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    label: "Stretch zone - Enjoying the Challenges",
    bgColor: "bg-yellow-500",
    emoji: "🤔",
    description: "Pushing your boundaries, feeling challenged but excited.",
  },
  {
    id: "stretch-overwhelmed",
    label: "Stretch zone - Overwhelmed",
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

export default function ComfortZoneCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {zones.map((zone) => (
        <Card key={zone.id} className={`${zone.bgColor} text-white`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{zone.label}</span>
              <span className="text-4xl">{zone.emoji}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{zone.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
