import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Badge } from "@/lib/types";
import { BadgeRenderer } from "./badge-renderer";

const STORAGE_KEY = "baro-achievements-open";

interface AchievementsSectionProps {
  badges: Badge[];
}

export function AchievementsSection({ badges }: AchievementsSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
        <Card className="border-4 border-yellow-600">
          <CollapsibleTrigger asChild className="cursor-pointer">
            <CardHeader className="bg-yellow-600 text-white">
              <CardTitle className="flex w-full items-center gap-2 font-bold uppercase tracking-wider" style={{ textShadow: "2px 2px 0px #B8860B" }}>
                <span className="text-xl">🏆</span>
                <span className="flex-1 text-left">My Achievements ({badges.length})</span>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 gap-y-4">
                {badges.map((badge, index) => (
                  <div key={badge._id || `badge-${badge.name || 'unknown'}-${index}`}>
                    <BadgeRenderer badge={badge} />
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}
