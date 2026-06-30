import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Check, XCircle, Copy, Download } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface BulkRegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedUser {
  first_name: string;
  last_name: string;
  email: string;
  jsd_number: string;
  project_group: string;
  genmate_group: string;
  zoom_name: string;
  password: string;
}

interface RegisterResult {
  email: string;
  status: string;
  password?: string;
  error?: string;
}

function parseCSV(text: string): ParsedUser[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        first_name: cols[0] || "",
        last_name: cols[1] || "",
        email: cols[2] || "",
        jsd_number: cols[3] || "",
        project_group: cols[4] || "",
        genmate_group: cols[5] || "",
        zoom_name: cols[6] || "",
        password: cols[7] || "",
      };
    });
}

export function BulkRegisterDialog({ isOpen, onClose, onSuccess }: BulkRegisterDialogProps) {
  const [cohortNumber, setCohortNumber] = useState("");
  const [fallbackPassword, setFallbackPassword] = useState("");
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ParsedUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<RegisterResult[] | null>(null);
  const [step, setStep] = useState<"input" | "preview" | "results">("input");

  const handleParse = () => {
    const users = parseCSV(csvText);
    if (users.length === 0) {
      toast.error("No valid rows found in CSV");
      return;
    }
    if (users.length > 200) {
      toast.error("Maximum 200 users per batch");
      return;
    }
    setParsed(users);
    setStep("preview");
  };

  const handleSubmit = async () => {
    if (!cohortNumber || isNaN(Number(cohortNumber))) {
      toast.error("Cohort number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const users = parsed.map((u) => ({
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        jsd_number: u.jsd_number,
        project_group: u.project_group || undefined,
        genmate_group: u.genmate_group || undefined,
        zoom_name: u.zoom_name || undefined,
        password: u.password || undefined,
      }));

      const response = await api.post("/admin/users/bulk-register", {
        cohort_number: Number(cohortNumber),
        password: fallbackPassword || undefined,
        users,
      });

      setResults(response.data.data || []);
      setStep("results");

      const successCount = response.data.successCount || 0;
      if (successCount > 0) {
        toast.success(`Registered ${successCount} learner${successCount !== 1 ? "s" : ""}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Request failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPasswords = () => {
    if (!results) return;
    const text = results
      .filter((r) => r.status === "created" && r.password)
      .map((r) => `${r.email},${r.password}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Passwords copied to clipboard");
  };

  const downloadCSV = () => {
    if (!results) return;
    const header = "email,password";
    const rows = results
      .filter((r) => r.status === "created" && r.password)
      .map((r) => `${r.email},${r.password}`);
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cohort-${cohortNumber}-passwords.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setCohortNumber("");
    setFallbackPassword("");
    setCsvText("");
    setParsed([]);
    setResults(null);
    setStep("input");
    if (results && results.some((r) => r.status === "created")) {
      onSuccess?.();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Register Learners
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cohort">Cohort Number</Label>
                <Input
                  id="cohort"
                  type="number"
                  placeholder="e.g. 17"
                  value={cohortNumber}
                  onChange={(e) => setCohortNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fallback-pw">Fallback Password (optional)</Label>
                <Input
                  id="fallback-pw"
                  type="text"
                  placeholder="auto-generated if blank"
                  value={fallbackPassword}
                  onChange={(e) => setFallbackPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv">
                Paste CSV
                <span className="text-xs text-muted-foreground ml-2">
                  (first_name,last_name,email,jsd_number,project_group,genmate_group,zoom_name,password)
                </span>
              </Label>
              <Textarea
                id="csv"
                placeholder={"John,Doe,john@gen.com,GEN17_01,ProjectA,1,John D,pass123\nJane,Smith,jane@gen.com,GEN17_02,ProjectB,2,Jane S"}
                className="font-mono text-sm min-h-[200px]"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleParse} disabled={!csvText.trim()}>Preview</Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {parsed.length} learner{parsed.length !== 1 ? "s" : ""} parsed. Review and submit.
            </p>
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">First</th>
                    <th className="p-2 text-left">Last</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">JSD</th>
                    <th className="p-2 text-left">Has PW</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((u, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{u.first_name}</td>
                      <td className="p-2">{u.last_name}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.jsd_number}</td>
                      <td className="p-2">{u.password ? "yes" : "no"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : `Register ${parsed.length} Learner${parsed.length !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "results" && results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="text-green-600 font-semibold">
                  {results.filter((r) => r.status === "created").length} created
                </span>
                {results.filter((r) => r.status !== "created").length > 0 && (
                  <span className="text-red-600 font-semibold ml-2">
                    , {results.filter((r) => r.status !== "created").length} skipped/failed
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyPasswords}>
                  <Copy className="h-4 w-4 mr-1" /> Copy Passwords
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="h-4 w-4 mr-1" /> Download CSV
                </Button>
              </div>
            </div>

            {results.filter((r) => r.status === "created" && r.password).length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200">
                Copy these passwords now — they won't be shown again. Only the bcrypt hash is stored.
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Password</th>
                    <th className="p-2 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.email}</td>
                      <td className="p-2">
                        {r.status === "created" ? (
                          <span className="flex items-center gap-1 text-green-600"><Check className="h-3 w-3" /> created</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3 w-3" /> {r.status}</span>
                        )}
                      </td>
                      <td className="p-2 font-mono text-xs">{r.password || "-"}</td>
                      <td className="p-2 text-red-500">{r.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
