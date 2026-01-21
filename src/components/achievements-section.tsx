import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { motion } from "framer-motion";
import type { Badge } from "@/lib/types";
import { PixelBadge } from "./pixel-badge";

interface AchievementsSectionProps {
  badges: Badge[];
}

export function AchievementsSection({ badges }: AchievementsSectionProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
      <Card className="border-4 border-yellow-600">
        <CardHeader className="bg-yellow-600 text-white">
          <CardTitle className="flex items-center gap-2 font-bold uppercase tracking-wider" style={{ textShadow: "2px 2px 0px #B8860B" }}>
            <span className="text-xl">🏆</span> My Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 gap-y-4">
            {badges.map((badge, index) => (
              <div key={badge._id || index}>
                <PixelBadge badge={badge} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
