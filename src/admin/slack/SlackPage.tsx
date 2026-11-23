import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { useConfirm } from "../ui/Confirm";
import { slackApi, type MatchResult, type SlackSettings } from "./api";

const card = "rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]";
const field = "w-full rounded-xl bg-l-sub px-3 py-2.5 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]";
const errMsg = (e: unknown) => (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Something went wrong";
const KIND: Record<string, string> = { new_leave: "New leave alert", announcement: "Announcement", ping: "Check-in ping", test: "Test message" };

export function SlackPage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const status = useQuery(["admin-slack"], () => slackApi.status());
  const connected = status.data?.connected === true;
  const channels = useQuery(["admin-slack-channels"], () => slackApi.channels(), { enabled: connected, retry: false });
  const log = useQuery(["admin-slack-log"], () => slackApi.log(), { enabled: connected, retry: false });
  const confirm = useConfirm();
  const [token, setToken] = useState("");
  const [form, setForm] = useState<SlackSettings | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const busy = useRef<Record<string, boolean>>({});
  useAdminHeader({ title: "Slack", context: connected ? status.data!.team : "Not connected" });

  useEffect(() => {
    const s = status.data;
    if (s?.connected) setForm({ alerts: s.alerts, report: s.report, announce: s.announce, alert_new_leave: s.alert_new_leave, quiet_from: s.quiet_from, quiet_to: s.quiet_to, report_auto: s.report_auto, report_cohort: s.report_cohort });
    else setForm(null);
  }, [status.data]);

  const once = async (key: string, fn: () => Promise<void>) => {
    if (busy.current[key]) return;
    busy.current[key] = true;
    try {
      await fn();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      busy.current[key] = false;
    }
  };
  const refresh = () => {
    qc.invalidateQueries(["admin-slack"]);
    qc.invalidateQueries(["admin-slack-available"]);
    qc.invalidateQueries(["admin-slack-log"]);
  };
  const connect = () =>
    once("connect", async () => {
      await slackApi.connect(token.trim());
      setToken("");
      toast.success("Slack connected");
      refresh();
    });
  const save = () =>
    once("save", async () => {
      if (!form) return;
      await slackApi.save(form);
      toast.success("Saved");
      refresh();
    });
  const test = (channel: "alerts" | "report" | "announce") =>
    once(`test-${channel}`, async () => {
      await slackApi.test(channel);
      toast.success("Test message sent");
      qc.invalidateQueries(["admin-slack-log"]);
    });
  const runMatch = () =>
    once("match", async () => {
      setMatch(await slackApi.match(cohort));
    });

  if (status.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-l-sub" />;
  const s = status.data;

  const channelSelect = (key: "alerts" | "report" | "announce", label: string, hint: string) => (
    <div className="grid items-center gap-2 sm:grid-cols-[170px_1fr_auto]">
      <div>
        <b className="block text-body font-semibold">{label}</b>
        <small className="text-xs text-l-ink3">{hint}</small>
      </div>
      <select aria-label={`${label} channel`} value={form?.[key] ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))} className={field}>
        <option value="">Not set</option>
        {(channels.data ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.private ? "🔒 " : "# "}
            {c.name}
          </option>
        ))}
      </select>
      <button type="button" disabled={!form?.[key]} aria-label={`Send test to ${label}`} onClick={() => test(key)} className="rounded-full px-3 py-1.5 text-xs font-semibold shadow-[0_0_0_1px_var(--l-hair)] disabled:opacity-40">
        Send test
      </button>
    </div>
  );

  return (
    <div className="flex max-w-[860px] flex-col gap-3.5">
      {!connected && (
        <section className={card}>
          <h4 className="text-body font-semibold">Connect your Slack workspace</h4>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-body leading-relaxed text-l-ink2">
            <li>
              In Slack go to <b>api.slack.com/apps</b> → Create New App → <b>From a manifest</b>, pick your workspace, and paste this manifest.
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(s?.manifest ?? "");
                    toast.success("Manifest copied");
                  } catch {
                    toast.error("Couldn't copy, select the text below instead");
                  }
                }}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-l-ink px-3 py-1 text-xs font-semibold text-l-card"
              >
                <Copy className="h-3.5 w-3.5" /> Copy manifest
              </button>
            </li>
            <li>
              Click <b>Install to Workspace</b>, then copy the <b>Bot User OAuth Token</b> (starts with <code>xoxb-</code>).
            </li>
            <li>Paste it here. Baro keeps it encrypted and never shows it again.</li>
          </ol>
          <div className="mt-4 flex gap-2">
            <input aria-label="Bot token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="xoxb-…" className={field} />
            <button type="button" disabled={!token.trim()} onClick={connect} className="rounded-full bg-l-ink px-5 text-body font-semibold text-l-card disabled:opacity-40">
              Connect
            </button>
          </div>
        </section>
      )}

      {connected && form && (
        <>
          <section className={`${card} flex flex-wrap items-center gap-3`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <b className="text-body font-semibold">Connected to {s!.team}</b>
              <small className="block text-xs text-l-ink3">as {s!.bot}</small>
            </div>
            <button
              type="button"
              onClick={() =>
                confirm.ask("Disconnect Slack?", () =>
                  once("disconnect", async () => {
                    await slackApi.disconnect();
                    refresh();
                  }), "Baro forgets the token and stops posting. Channels and learner matches are kept if you reconnect.")
              }
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-red-600 shadow-[0_0_0_1px_var(--l-hair)]"
            >
              Disconnect
            </button>
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h4 className="text-body font-semibold">Where Baro posts</h4>
            {channelSelect("alerts", "Admin alerts", "New leave requests. Private is best.")}
            {channelSelect("announce", "Announcements", "Announcements you tick “also post to Slack”.")}
            {channelSelect("report", "Weekly report", "Where the weekly report is posted.")}
            <div className="flex flex-wrap items-center gap-2.5 text-body">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  aria-label="Send the weekly report automatically on Fridays at 17:00"
                  checked={form.report_auto}
                  onChange={(e) => setForm({ ...form, report_auto: e.target.checked, report_cohort: e.target.checked && !form.report_cohort ? cohort : form.report_cohort })}
                  className="accent-zinc-900"
                />
                Send the weekly report automatically on Fridays at 17:00
              </label>
              {form.report_auto && (
                <label className="flex items-center gap-1.5 text-xs text-l-ink2">
                  for JSD
                  <input aria-label="Cohort for the weekly report" type="number" min={1} value={form.report_cohort || ""} onChange={(e) => setForm({ ...form, report_cohort: Number(e.target.value) || 0 })} className="w-16 rounded-lg bg-l-sub px-2 py-1 text-body shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
                </label>
              )}
            </div>
          </section>

          <section className={`${card} flex flex-col gap-3`}>
            <h4 className="text-body font-semibold">Alerts and quiet hours</h4>
            <label className="flex items-center gap-2.5 text-body">
              <input type="checkbox" checked={form.alert_new_leave} onChange={(e) => setForm({ ...form, alert_new_leave: e.target.checked })} className="accent-zinc-900" />
              Post to Admin alerts when a learner asks for leave
            </label>
            <div className="flex flex-wrap items-center gap-2 text-body">
              <span className="text-l-ink2">No DMs to learners between</span>
              <input aria-label="Quiet from" type="time" value={form.quiet_from} onChange={(e) => setForm({ ...form, quiet_from: e.target.value })} className="rounded-lg bg-l-sub px-2 py-1 shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
              <span className="text-l-ink2">and</span>
              <input aria-label="Quiet to" type="time" value={form.quiet_to} onChange={(e) => setForm({ ...form, quiet_to: e.target.value })} className="rounded-lg bg-l-sub px-2 py-1 shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
              <small className="text-xs text-l-ink3">Bangkok time. Empty = 21:00 to 08:00.</small>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={save} className="rounded-full bg-l-ink px-5 py-2 text-body font-semibold text-l-card">
                Save
              </button>
            </div>
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-body font-semibold">Learners on Slack · JSD{cohort}</h4>
                <small className="text-xs text-l-ink3">Baro finds each learner by their email so it can DM them.</small>
              </div>
              <button type="button" onClick={runMatch} className="rounded-full px-4 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                Match by email
              </button>
            </div>
            {match && (
              <div className="mt-3 text-body">
                <b>{match.matched} matched</b>
                {match.missing.length > 0 && <span className="text-l-ink2"> · {match.missing.length} not found</span>}
                {match.note && <p className="mt-1 text-xs font-semibold text-amber-700">{match.note}</p>}
                {match.missing.length > 0 && (
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {match.missing.map((m) => (
                      <li key={m.id} className="rounded-lg bg-l-sub px-2.5 py-1.5 text-xs">
                        <b className="font-semibold">{m.name}</b> <span className="text-l-ink3">{m.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className={card}>
            <h4 className="text-body font-semibold">Recent sends</h4>
            {(log.data ?? []).length === 0 && <p className="mt-2 text-xs text-l-ink3">Nothing sent yet.</p>}
            <div className="mt-2 flex flex-col">
              {(log.data ?? []).map((e, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-l-hair py-2 text-small last:border-0">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="w-36 shrink-0 font-semibold">{KIND[e.kind] ?? e.kind}</span>
                  <span className="min-w-0 flex-1 truncate text-l-ink3">{e.ok ? "Sent" : e.error}</span>
                  <span className="whitespace-nowrap text-l-ink3">{new Date(e.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" })}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {confirm.node}
    </div>
  );
}

