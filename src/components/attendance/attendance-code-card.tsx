import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceCodeCardProps {
  session: "morning" | "afternoon";
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  activeCode: { code: string } | null;
  timeLeft: string;
  isGenerating: boolean;
  onGenerate: (session: "morning" | "afternoon") => void;
}

export function AttendanceCodeCard({
  session,
  title,
  description,
  gradientFrom,
  gradientTo,
  textColor,
  activeCode,
  timeLeft,
  isGenerating,
  onGenerate,
}: AttendanceCodeCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="text-white pb-3"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className={textColor}>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <Button
          onClick={() => onGenerate(session)}
          disabled={isGenerating}
          className="w-full"
          variant={activeCode ? "outline" : "default"}
        >
          {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          {activeCode ? "Regenerate Code" : "Generate Code"}
        </Button>
        {activeCode && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Code</p>
            <p className="text-3xl font-bold font-mono tracking-wider">{activeCode.code}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Valid for: <span className="font-semibold text-primary">{timeLeft}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
