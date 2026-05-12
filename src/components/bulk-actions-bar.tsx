import { Button } from "@/components/ui/button";
import { Award, Calendar, Download, X, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onBulkBadge: () => void;
  onBulkAttendance: () => void;
  onBulkExport: () => void;
  isExporting?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onBulkBadge,
  onBulkAttendance,
  onBulkExport,
  isExporting,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4 p-3 rounded-lg border bg-primary/10 border-primary/30"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{selectedCount}</span>
              <span className="text-muted-foreground">/ {totalCount} selected</span>
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* select all - handled by parent */}}
              className="text-xs h-7 px-2"
            >
              Select All
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkBadge}
              className="gap-1.5"
            >
              <Award className="h-4 w-4" />
              Award Badge
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkAttendance}
              className="gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Mark Attendance
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              disabled={isExporting}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Selected"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
