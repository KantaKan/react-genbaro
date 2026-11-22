import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { useConfirm } from "../ui/Confirm";
import { useStaff } from "./useStaff";
import { ROLE_LABEL, type StaffRole } from "./perm";
import { inviteLink, teamApi, type InviteInput, type Member } from "./api";

const LETTERS = "ABCDEFGHIJ".split("");
const field = "w-full rounded-xl bg-l-sub px-3 py-2 text-[13.5px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]";
const seg = (on: boolean) => `rounded-[7px] px-3 py-1 text-xs font-semibold ${on ? "bg-l-ink text-l-card" : "text-l-ink2"}`;
const chip = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-[0_0_0_1px_var(--l-hair)]";
const errMsg = (e: unknown) => (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Something went wrong";

function toggle<T>(xs: T[], x: T) {
  return xs.includes(x) ? xs.filter((v) => v !== x) : [...xs, x];
}

function LinkBox({ token, note }: { token: string; note: string }) {
  const link = inviteLink(token);
  return (
    <div className="rounded-2xl bg-l-sub p-3 shadow-[0_0_0_1px_var(--l-hair)]">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 shrink-0 text-l-ink3" />
        <input aria-label="Invite link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none" />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              toast.success("Link copied");
            } catch {
              toast.error("Couldn't copy, select the link instead");
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-l-ink px-3 py-1 text-xs font-semibold text-l-card"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <p className="mt-1.5 text-[11.5px] text-l-ink3">{note}</p>
    </div>
  );
}

function InviteDialog({ open, onOpenChange, cohortChoices, defaultCohort }: { open: boolean; onOpenChange: (o: boolean) => void; cohortChoices: number[]; defaultCohort: number }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteInput["role"]>("ta");
  const [cohorts, setCohorts] = useState<number[]>([defaultCohort]);
  const [groups, setGroups] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const busy = useRef(false);
  const ok = email.includes("@") && cohorts.length > 0 && (role !== "ta" || groups.length > 0);
  const create = async () => {
    if (busy.current || !ok) return;
    busy.current = true;
    try {
      const r = await teamApi.invite({ email: email.trim(), role, cohorts, groups: role === "ta" ? groups : [] });
      setToken(r.token);
      qc.invalidateQueries(["admin-team"]);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      busy.current = false;
    }
  };
  const close = (o: boolean) => {
    if (!o) {
      setEmail("");
      setGroups([]);
      setToken(null);
    }
    onOpenChange(o);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="learner max-w-[480px] rounded-[22px] border-0 bg-l-card text-l-ink">
        <DialogTitle>{token ? "Send this link" : "Invite someone"}</DialogTitle>
        {token ? (
          <div className="grid gap-3">
            <p className="text-[13px] text-l-ink2">Send it to {email.trim()} on Slack or chat. They set their own password.</p>
            <LinkBox token={token} note="Works once. Expires in 7 days." />
            <button type="button" onClick={() => close(false)} className="rounded-full bg-l-ink py-2.5 text-[13.5px] font-semibold text-l-card">
              Done
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <label className="text-xs font-semibold text-l-ink2">
              Email
              <input aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} mt-1.5`} />
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-16 text-xs text-l-ink3">Role</span>
              <div className="inline-flex rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
                {(["admin", "ta", "viewer"] as const).map((r) => (
                  <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={seg(role === r)}>
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-16 text-xs text-l-ink3">Cohorts</span>
              {cohortChoices.map((c) => (
                <label key={c} className={chip}>
                  <input type="checkbox" aria-label={`JSD${c}`} checked={cohorts.includes(c)} onChange={() => setCohorts((x) => toggle(x, c))} className="accent-zinc-900" />
                  JSD{c}
                </label>
              ))}
            </div>
            {role === "ta" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-16 text-xs text-l-ink3">Groups</span>
                {LETTERS.map((g) => (
                  <label key={g} className={chip}>
                    <input type="checkbox" aria-label={`Group ${g}`} checked={groups.includes(g)} onChange={() => setGroups((x) => toggle(x, g))} className="accent-zinc-900" />
                    {g}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-l-ink3">{ROLE_HINT[role]}</p>
            <button type="button" disabled={!ok} onClick={create} className="rounded-full bg-l-ink py-2.5 text-[13.5px] font-semibold text-l-card disabled:opacity-40">
              Create invite link
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const ROLE_HINT: Record<InviteInput["role"], string> = {
  admin: "Everything for their cohorts except the team and Slack settings.",
  ta: "Marks attendance, notes, leave up to 6 of 8, and announcements to their own groups.",
  viewer: "Can look at everything in their cohorts, can't change anything.",
};

const PERMS: [string, string, string, string, string][] = [
  ["See Today, reflections, profiles", "✓", "✓", "✓", "✓"],
  ["Mark attendance", "✓", "✓", "✓", "–"],
  ["Approve leave", "✓", "✓", "up to 6/8", "–"],
  ["Notes, support plans, Cup points", "✓", "✓", "✓", "–"],
  ["Announcements", "✓", "✓", "own groups", "–"],
  ["Gifts & badges", "✓", "✓", "–", "–"],
  ["Rules, holidays, groups, exports", "✓", "✓", "–", "–"],
  ["Team, Slack, new cohorts", "✓", "–", "–", "–"],
];

export function TeamPage() {
  const [cohort] = useCohort();
  const me = useStaff();
  const qc = useQueryClient();
  const q = useQuery(["admin-team"], () => teamApi.team());
  const [inviting, setInviting] = useState(false);
  const [renewed, setRenewed] = useState<Record<string, string>>({});
  const confirm = useConfirm();
  useAdminHeader({ title: "Team & roles", context: `${q.data?.members.length ?? 0} people`, actions: (
    <button type="button" onClick={() => setInviting(true)} className="rounded-full bg-l-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-l-card">
      Invite someone
    </button>
  ) });
  const cohortChoices = useMemo(() => {
    const s = new Set<number>([cohort]);
    q.data?.members.forEach((m) => m.cohorts.forEach((c) => s.add(c)));
    return [...s].sort((a, b) => b - a);
  }, [q.data, cohort]);
  const change = async (m: Member, role: StaffRole) => {
    try {
      await teamApi.update(m.id, { role, cohorts: role === "owner" ? [] : m.cohorts.length ? m.cohorts : [cohort], groups: role === "ta" ? m.groups : [] });
      toast.success(`${m.first_name} is now ${ROLE_LABEL[role]}`);
      qc.invalidateQueries(["admin-team"]);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const days = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400e3);
  return (
    <div className="flex max-w-[980px] flex-col gap-4">
      <section className="overflow-x-auto rounded-2xl shadow-[0_0_0_1px_var(--l-hair)]">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-l-ink3">
              <th className="px-4 py-2.5 font-medium">Person</th>
              <th className="px-2 py-2.5 font-medium">Role</th>
              <th className="px-2 py-2.5 font-medium">Cohorts</th>
              <th className="px-2 py-2.5 font-medium">Groups</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {(q.data?.members ?? []).map((m) => {
              const mine = m.id === me.id;
              return (
                <tr key={m.id} className="border-t border-l-hair">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar userId={m.id} name={`${m.first_name} ${m.last_name}`} className="h-8 w-8 shrink-0" />
                      <div className="min-w-0">
                        <b className="block font-semibold">
                          {m.first_name} {m.last_name}
                          {mine && <span className="ml-1.5 text-[11px] font-medium text-l-ink3">you</span>}
                        </b>
                        <span className="text-xs text-l-ink3">{m.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    {mine ? (
                      <span className="font-semibold">{ROLE_LABEL[m.staff_role]}</span>
                    ) : (
                      <select aria-label={`Role for ${m.first_name}`} value={m.staff_role} onChange={(e) => change(m, e.target.value as StaffRole)} className="rounded-lg bg-l-sub px-2 py-1 text-[12.5px] font-semibold shadow-[0_0_0_1px_var(--l-hair)] outline-none">
                        {(["owner", "admin", "ta", "viewer"] as const).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-l-ink2">{m.staff_role === "owner" ? "All" : m.cohorts.map((c) => `JSD${c}`).join(", ") || "–"}</td>
                  <td className="px-2 py-2.5 text-l-ink2">{m.staff_role === "ta" ? m.groups.join(", ") || "–" : ""}</td>
                  <td className="px-4 py-2.5 text-right">
                    {!mine && (
                      <button
                        type="button"
                        aria-label={`Remove ${m.first_name}`}
                        onClick={() =>
                          confirm.ask(`Remove ${m.first_name} from the team?`, async () => {
                            try {
                              await teamApi.remove(m.id);
                              qc.invalidateQueries(["admin-team"]);
                            } catch (e) {
                              toast.error(errMsg(e));
                            }
                          }, "They're signed out of the admin right away and can't log in. You can invite them again later.")
                        }
                        className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 shadow-[0_0_0_1px_var(--l-hair)]"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {q.isLoading && <div className="m-4 h-16 animate-pulse rounded-xl bg-l-sub" />}
      </section>

      {(q.data?.invites.length ?? 0) > 0 && (
        <section>
          <h3 className="mb-2 text-[15px] font-semibold">Waiting to join</h3>
          <div className="flex flex-col gap-2 rounded-2xl p-3 shadow-[0_0_0_1px_var(--l-hair)]">
            {q.data!.invites.map((i) => {
              const left = days(i.expires_at);
              return (
                <div key={i.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3 px-1 text-[13px]">
                    <b className="min-w-0 flex-1 truncate font-semibold">{i.email}</b>
                    <span className="text-l-ink2">{ROLE_LABEL[i.role]}</span>
                    <span className={`text-xs ${left > 0 ? "text-l-ink3" : "font-semibold text-amber-700"}`}>{left > 0 ? `expires in ${left} day${left === 1 ? "" : "s"}` : "expired"}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const r = await teamApi.renew(i.id);
                          setRenewed((m) => ({ ...m, [i.id]: r.token }));
                          qc.invalidateQueries(["admin-team"]);
                        } catch (e) {
                          toast.error(errMsg(e));
                        }
                      }}
                      className="rounded-full px-3 py-1 text-xs font-semibold shadow-[0_0_0_1px_var(--l-hair)]"
                    >
                      New link
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await teamApi.cancelInvite(i.id);
                        qc.invalidateQueries(["admin-team"]);
                      }}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-l-ink2"
                    >
                      Cancel
                    </button>
                  </div>
                  {renewed[i.id] && <LinkBox token={renewed[i.id]} note="The old link no longer works. This one expires in 7 days." />}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-[15px] font-semibold">What each role can do</h3>
        <div className="overflow-x-auto rounded-2xl shadow-[0_0_0_1px_var(--l-hair)]">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead>
              <tr className="text-left text-[11.5px] text-l-ink3">
                <th className="px-4 py-2 font-medium" />
                {["Owner", "Admin", "TA", "Viewer"].map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMS.map(([what, ...cells]) => (
                <tr key={what} className="border-t border-l-hair">
                  <td className="px-4 py-2">{what}</td>
                  {cells.map((c, i) => (
                    <td key={i} className={`px-2 py-2 text-center ${c === "–" ? "text-l-ink3" : "font-medium"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <InviteDialog open={inviting} onOpenChange={setInviting} cohortChoices={cohortChoices} defaultCohort={cohort} />
      {confirm.node}
    </div>
  );
}
