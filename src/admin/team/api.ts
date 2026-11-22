import { api } from "@/infrastructure/api";
import type { StaffRole } from "./perm";

type Envelope<T> = { data: T };
const data = async <T,>(p: Promise<{ data: Envelope<T> }>) => (await p).data.data;

export type Member = { id: string; first_name: string; last_name: string; email: string; staff_role: StaffRole; cohorts: number[]; groups: string[]; created_at: string };
export type PendingInvite = { id: string; email: string; role: Exclude<StaffRole, "owner">; cohorts: number[]; groups: string[]; expires_at: string };
export type InviteInput = { email: string; role: Exclude<StaffRole, "owner">; cohorts: number[]; groups: string[] };
export type InviteInfo = { email: string; role: StaffRole; cohorts: number[]; existing: boolean; expires_at: string };

export const inviteLink = (token: string) => `${window.location.origin}/invite/${token}`;

export const teamApi = {
  team: () => data<{ members: Member[]; invites: PendingInvite[] }>(api.get("/admin/team")),
  invite: (b: InviteInput) => data<{ id: string; token: string; expires_at: string }>(api.post("/admin/team/invites", b)),
  renew: (id: string) => data<{ token: string; expires_at: string }>(api.post(`/admin/team/invites/${id}/renew`)),
  cancelInvite: (id: string) => api.delete(`/admin/team/invites/${id}`).then(() => undefined),
  update: (id: string, b: { role: StaffRole; cohorts: number[]; groups: string[] }) => api.patch(`/admin/team/${id}`, b).then(() => undefined),
  remove: (id: string) => api.delete(`/admin/team/${id}`).then(() => undefined),
};

export const inviteApi = {
  get: (token: string) => data<InviteInfo>(api.get(`/invites/${encodeURIComponent(token)}`)),
  accept: (token: string, b: { first_name?: string; last_name?: string; password: string }) => api.post(`/invites/${encodeURIComponent(token)}/accept`, b).then(() => undefined),
};
