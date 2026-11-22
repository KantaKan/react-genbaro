import { api } from "@/infrastructure/api";
import type { CalWeek } from "@/calendar/types";

type Envelope<T> = { data: T };
const data = async <T,>(p: Promise<{ data: Envelope<T> }>) => (await p).data.data;

export type SavedCalendar = {
  cohort: number;
  sheet?: string;
  zoom_url: string;
  weeks: CalWeek[];
  imported_at?: string;
  imported_by?: string;
  version: number;
  imported: boolean;
};
export type CalWarning = { level: "warn" | "info"; week: number; day?: string; message: string };
export type WeekDiff = { n: number; name: string; status: "new" | "changed" | "same" | "removed"; published: boolean; added: number; removed: number; lines: string[] };
export type ImportPreview = {
  sheet: string;
  needs_sheet?: string[];
  weeks: number;
  sessions: number;
  warnings: CalWarning[];
  diff: WeekDiff[];
  zoom_url: string;
  has_existing: boolean;
  saved: boolean;
  version: number;
};

export const calendarApi = {
  get: (cohort: number) => data<SavedCalendar>(api.get(`/admin/calendar?cohort=${cohort}`)),
  /** Without save this only previews; with save the calendar is stored (version = the one previewed). */
  import: (cohort: number, file: File, o: { sheet?: string; save?: boolean; version?: number } = {}) => {
    const form = new FormData();
    form.append("file", file);
    const q = new URLSearchParams({ cohort: String(cohort) });
    if (o.sheet) q.set("sheet", o.sheet);
    if (o.save) q.set("save", "1");
    if (o.version !== undefined) q.set("version", String(o.version));
    return data<ImportPreview>(api.post(`/admin/calendar/import?${q}`, form));
  },
  publish: (cohort: number, n: number, published: boolean) => api.put(`/admin/calendar/weeks/${n}/publish?cohort=${cohort}`, { published }).then(() => undefined),
  setZoom: (cohort: number, zoom_url: string) => api.put(`/admin/calendar/settings?cohort=${cohort}`, { zoom_url }).then(() => undefined),
};
