import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Calendar, ChevronDown, Cloud } from "lucide-react";
import { toast } from "react-toastify";
import { attendanceService } from "@/application/services/attendanceService";

interface SalesforceExportModalProps {
  cohort: number;
  onClose: () => void;
}

const PRESET_RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
];

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateString(d);
}

export function SalesforceExportModal({ cohort, onClose }: SalesforceExportModalProps) {
  const today = toDateString(new Date());
  const [startDate, setStartDate] = useState(getDaysAgo(7));
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);

  const applyPreset = (days: number) => {
    setStartDate(getDaysAgo(days));
    setEndDate(today);
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a start and end date.");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date must be before end date.");
      return;
    }

    setIsExporting(true);
    try {
      const blob = await attendanceService.exportSalesforceCSV(cohort, startDate, endDate);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `salesforce_attendance_cohort${cohort}_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Salesforce CSV exported successfully!");
      onClose();
    } catch {
      toast.error("Failed to export CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-md mx-4"
        style={{
          background: "linear-gradient(135deg, #1a1f2e 0%, #151929 100%)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "1.25rem",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">Export to Salesforce</h2>
              <p className="text-white/50 text-xs mt-0.5">Cohort {cohort} · CSV format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Quick presets */}
          <div className="space-y-2">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Quick Select</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_RANGES.map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => applyPreset(preset.days)}
                  className="px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white transition-all text-left"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.2)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-3 h-3 opacity-50" />
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          <div className="space-y-2">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Custom Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-white/40 text-xs">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  <input
                    type="date"
                    id="salesforce-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      colorScheme: "dark",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-white/40 text-xs">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  <input
                    type="date"
                    id="salesforce-end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={today}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      colorScheme: "dark",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info pill */}
          <div
            className="px-4 py-3 rounded-xl text-xs text-white/50 leading-relaxed"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
          >
            📋 CSV will include: <span className="text-white/70">Learner ID, First Name, Last Name, Date, Attendance Status, Notes</span>.
            One row per student per day. Status reflects worst session (Absent &gt; Late &gt; Present).
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Cancel
          </button>
          <button
            id="salesforce-export-btn"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              background: isExporting
                ? "rgba(99,102,241,0.4)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              opacity: isExporting ? 0.7 : 1,
              cursor: isExporting ? "not-allowed" : "pointer",
            }}
          >
            {isExporting ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download CSV
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function SalesforceExportButton({ cohort }: { cohort: number }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        id="salesforce-export-open-btn"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 15px rgba(99,102,241,0.35)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        <Cloud className="w-4 h-4" />
        Export to Salesforce
      </button>
      <AnimatePresence>
        {showModal && (
          <SalesforceExportModal
            cohort={cohort}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
