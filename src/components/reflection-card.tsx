"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Reflection } from "@/hooks/use-reflections";
import { reflectionZones } from "./reflection-zones";
import { BarometerVisual } from "./barometer-visual";

interface ReflectionCardProps {
  reflection: Reflection;
}

export const ReflectionCard = ({ reflection }: ReflectionCardProps) => {
  const zone = reflectionZones.find((z) => z.label === reflection.reflection.barometer);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">
              {new Date(reflection.day || reflection.date).toLocaleDateString()}
            </CardTitle>
            {zone && <BarometerVisual zone={zone} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Tech Session</h4>
          <div className="text-sm">
            <p><strong>What went well:</strong> {reflection.reflection.tech_sessions.happy}</p>
            <p><strong>What to improve:</strong> {reflection.reflection.tech_sessions.improve}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Non-Tech Session</h4>
          <div className="text-sm">
            <p><strong>What went well:</strong> {reflection.reflection.non_tech_sessions.happy}</p>
            <p><strong>What to improve:</strong> {reflection.reflection.non_tech_sessions.improve}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
