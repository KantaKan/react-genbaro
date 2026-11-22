import { api } from "@/infrastructure/api";

type Envelope<T> = { data: T };
const data = async <T,>(p: Promise<{ data: Envelope<T> }>) => (await p).data.data;

export type SlackStatus = {
  connected: boolean;
  team: string;
  bot: string;
  alerts: string;
  report: string;
  announce: string;
  alert_new_leave: boolean;
  quiet_from: string;
  quiet_to: string;
  report_auto: boolean;
  report_cohort: number;
  manifest: string;
};
export type SlackSettings = Pick<SlackStatus, "alerts" | "report" | "announce" | "alert_new_leave" | "quiet_from" | "quiet_to" | "report_auto" | "report_cohort">;
export type SlackChannel = { id: string; name: string; private: boolean };
export type MatchResult = { matched: number; missing: { id: string; name: string; email: string }[]; note?: string };
export type SlackLogEntry = { at: string; kind: string; target: string; ok: boolean; error?: string };
export type PingResult = { sent: number; no_slack: string[]; failed: number; recent: number; quiet: boolean };

export const slackApi = {
  status: () => data<SlackStatus>(api.get("/admin/settings/slack")),
  connect: (token: string) => data<SlackStatus>(api.post("/admin/settings/slack/connect", { token })),
  disconnect: () => api.delete("/admin/settings/slack").then(() => undefined),
  save: (s: SlackSettings) => api.put("/admin/settings/slack/settings", s).then(() => undefined),
  channels: () => data<SlackChannel[]>(api.get("/admin/settings/slack/channels")),
  test: (channel: "alerts" | "report" | "announce") => api.post("/admin/settings/slack/test", { channel }).then(() => undefined),
  match: (cohort: number) => data<MatchResult>(api.post("/admin/settings/slack/match", { cohort })),
  log: () => data<SlackLogEntry[]>(api.get("/admin/settings/slack/log")),
  available: () => data<{ connected: boolean }>(api.get("/admin/nudges/status")),
  ping: (user_ids: string[]) => data<PingResult>(api.post("/admin/nudges/ping", { user_ids })),
};
