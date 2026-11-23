import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Trophy, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminCupApi, type AwardInput } from "@/learner/cup/api";
import { CATEGORY_LABEL } from "@/learner/cup/lib";
import { useAdminHeader } from "@/admin/shell/AdminShell";
import { useCohort } from "@/admin/shell/useCohort";

const CATS: AwardInput["category"][] = ["coding", "soft", "helping"];

/** v1 TA tool: award GenMate Cup points and undo mistakes. Showing up is added by the server. */
export default function CupAwardsPage() {
  const qc = useQueryClient();
  const [n] = useCohort();
  const [group, setGroup] = useState("");
  const [category, setCategory] = useState<AwardInput["category"]>("coding");
  const [points, setPoints] = useState("10");
  const [reason, setReason] = useState("");
  const sending = useRef(false);
  useAdminHeader({ title: "GenMate Cup", context: `Award points · JSD${n}` });
  const data = useQuery(["admin-cup", n], () => adminCupApi.standings(n), { enabled: n > 0 });
  const pts = Number(points);
  const ok = n > 0 && !!group && pts >= 1 && pts <= 100 && reason.trim().length > 0 && reason.trim().length <= 140;

  const submit = async () => {
    if (!ok || sending.current) return;
    sending.current = true;
    try {
      await adminCupApi.award({ cohort: n, group, category, points: pts, reason: reason.trim() });
      toast.success(`+${pts} to Group ${group}`);
      setReason("");
      qc.invalidateQueries(["admin-cup", n]);
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Couldn't award points");
    } finally {
      sending.current = false;
    }
  };
  const undo = async (id: string) => {
    try {
      await adminCupApi.remove(id);
      qc.invalidateQueries(["admin-cup", n]);
    } catch {
      toast.error("Couldn't undo");
    }
  };

  const groups = data.data?.standings ?? [];
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> GenMate Cup points
          </CardTitle>
          <CardDescription>Award Coding, Soft skills or Helping points. The server adds +15 Showing up when a whole group is on time.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Group</Label>
            <div className="flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <Button key={g.group} type="button" size="sm" variant={group === g.group ? "default" : "outline"} aria-label={`Group ${g.group}`} onClick={() => setGroup(g.group)}>
                  {g.group}
                </Button>
              ))}
              {n > 0 && !data.isLoading && groups.length === 0 && <span className="text-sm text-muted-foreground">No GenMate groups in this cohort.</span>}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <div className="flex gap-1.5">
              {CATS.map((c) => (
                <Button key={c} type="button" size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
                  {CATEGORY_LABEL[c]}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cup-points">Points</Label>
            <Input id="cup-points" type="number" min={1} max={100} value={points} onChange={(e) => setPoints(e.target.value)} className="w-32" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cup-reason">Reason</Label>
            <Textarea id="cup-reason" maxLength={140} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Mini-project demo, pitch practice, helped another group…" />
          </div>
          <Button type="button" onClick={submit} disabled={!ok} className="w-fit">
            Award points
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>This week{data.data ? ` · from ${data.data.week}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          {groups.map((g, i) => (
            <div key={g.group} className="flex justify-between">
              <span>
                #{i + 1} Group {g.group}
              </span>
              <b className="tabular-nums">{g.total}</b>
            </div>
          ))}
          <div className="grid gap-1 border-t pt-3">
            {(data.data?.awards ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {a.group} · +{a.points} {CATEGORY_LABEL[a.category]} · {a.reason}
                </span>
                {a.category !== "showing_up" && (
                  <Button type="button" size="icon" variant="ghost" aria-label={`Undo ${a.reason}`} onClick={() => undo(a.id)}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
