import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Edit3, Check, X, AlertCircle, ArrowUpDown } from "lucide-react";
import { toast } from "react-toastify";
import { attendanceService } from "@/application/services/attendanceService";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  jsd_number?: string;
  salesforce_id?: string;
}

interface SalesforceIDManagerProps {
  users: User[];
  onUpdate: (userId: string, newSalesforceId: string) => void;
}

interface RowState {
  editing: boolean;
  value: string;
  saving: boolean;
}

export function SalesforceIDManager({ users, onUpdate }: SalesforceIDManagerProps) {
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Parse the leading number from jsd_number (e.g. "01_Akkarawin..." → 1)
  const jsdNum = (jsd?: string) => {
    if (!jsd) return 9999;
    const match = jsd.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 9999;
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const diff = jsdNum(a.jsd_number) - jsdNum(b.jsd_number);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [users, sortDir]);

  const getState = (userId: string, current: string | undefined): RowState =>
    rowStates[userId] ?? { editing: false, value: current ?? "", saving: false };

  const startEdit = (userId: string, currentId: string | undefined) => {
    setRowStates((prev) => ({
      ...prev,
      [userId]: { editing: true, value: currentId ?? "", saving: false },
    }));
  };

  const cancelEdit = (userId: string) => {
    setRowStates((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const saveEdit = async (userId: string) => {
    const state = rowStates[userId];
    if (!state) return;

    setRowStates((prev) => ({ ...prev, [userId]: { ...state, saving: true } }));

    try {
      await attendanceService.updateSalesforceID(userId, state.value.trim());
      onUpdate(userId, state.value.trim());
      toast.success("Salesforce ID updated!");
      cancelEdit(userId);
    } catch {
      toast.error("Failed to update Salesforce ID.");
      setRowStates((prev) => ({ ...prev, [userId]: { ...state, saving: false } }));
    }
  };

  const noSalesforceId = users.filter((u) => !u.salesforce_id);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1f2e 0%, #151929 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Salesforce ID Management</h3>
            <p className="text-white/40 text-xs mt-0.5">
              Link learners to their Salesforce Learner IDs
            </p>
          </div>
        </div>
        {noSalesforceId.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b",
            }}
          >
            <AlertCircle className="w-3 h-3" />
            {noSalesforceId.length} missing
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                <button
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
                  title={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
                >
                  JSD #
                  <ArrowUpDown className="w-3 h-3" />
                  <span className="text-white/25 normal-case font-normal">{sortDir === "asc" ? "↑" : "↓"}</span>
                </button>
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Salesforce ID
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sortedUsers.map((user, i) => {
                const state = getState(user._id, user.salesforce_id);
                const hasId = !!user.salesforce_id;

                return (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: state.editing ? "rgba(99,102,241,0.06)" : "transparent",
                    }}
                  >
                    {/* JSD Number */}
                    <td className="px-6 py-3">
                      <span className="text-white/50 text-sm font-mono">
                        {user.jsd_number || "-"}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-6 py-3">
                      <span className="text-white text-sm">
                        {user.first_name} {user.last_name}
                      </span>
                    </td>

                    {/* Salesforce ID */}
                    <td className="px-6 py-3">
                      {state.editing ? (
                        <input
                          id={`sf-id-input-${user._id}`}
                          type="text"
                          value={state.value}
                          onChange={(e) =>
                            setRowStates((prev) => ({
                              ...prev,
                              [user._id]: { ...state, value: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(user._id);
                            if (e.key === "Escape") cancelEdit(user._id);
                          }}
                          placeholder="a1gUZ00000..."
                          className="w-full px-3 py-1.5 rounded-lg text-sm text-white font-mono outline-none transition-all"
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(99,102,241,0.5)",
                            boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-sm font-mono ${
                            hasId ? "text-indigo-400" : "text-white/20"
                          }`}
                        >
                          {user.salesforce_id || "Not set"}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-3">
                      {state.editing ? (
                        <div className="flex items-center gap-2">
                          <button
                            id={`sf-save-${user._id}`}
                            onClick={() => saveEdit(user._id)}
                            disabled={state.saving}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all"
                            style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.3)" }}
                            title="Save"
                          >
                            {state.saving ? (
                              <motion.div
                                className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                              />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            )}
                          </button>
                          <button
                            onClick={() => cancelEdit(user._id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`sf-edit-${user._id}`}
                          onClick={() => startEdit(user._id, user.salesforce_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.15)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                          {hasId ? "Edit" : "Set ID"}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-10 text-white/30 text-sm">
          No learners found for this cohort.
        </div>
      )}
    </div>
  );
}
