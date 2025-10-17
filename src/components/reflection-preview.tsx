import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Reflection } from "../lib/types"; // Make sure to import your Reflection type
import { getColorForBarometer } from "./reflection-zones";

interface ReflectionPreviewProps {
  reflection: Reflection;
}

export function ReflectionPreview({ reflection }: ReflectionPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-normal text-blue-600 underline">
          View Today's Reflection
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Today's Reflection</h4>
            <p className="text-sm text-muted-foreground">Quick overview of your daily reflection</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Barometer:</span>
              <span className={`col-span-2 text-sm font-medium px-2 py-1 rounded ${getColorForBarometer(reflection.reflection.barometer)}`}>{reflection.reflection.barometer}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Tech Happy:</span>
              <span className="col-span-2 text-sm">{reflection.reflection.tech_sessions.happy}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Tech Improve:</span>
              <span className="col-span-2 text-sm">{reflection.reflection.tech_sessions.improve}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Non-Tech Happy:</span>
              <span className="col-span-2 text-sm">{reflection.reflection.non_tech_sessions.happy}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Non-Tech Improve:</span>
              <span className="col-span-2 text-sm">{reflection.reflection.non_tech_sessions.improve}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
