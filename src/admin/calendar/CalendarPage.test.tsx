import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { CalendarPage } from "./CalendarPage";
import { calendarApi, type ImportPreview, type SavedCalendar } from "./api";
import { adminApi } from "../api";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn() } }));
vi.mock("./api", () => ({ calendarApi: { get: vi.fn(), import: vi.fn(), publish: vi.fn(), setZoom: vi.fn() } }));

const session = (start: string, end: string, title: string, o = {}) => ({ start, end, code: "", title, subtitle: "", facilitators: ["Kan"], type: "technical", kind: "session" as const, ...o });
const week = (n: number, monday: string, published: boolean) => ({
  n,
  name: `WEEK ${n}`,
  monday,
  published,
  published_at: published ? "2026-11-20T03:00:00Z" : null,
  days: [{ date: monday, label: `DAY ${n}`, weekday: 0, holiday: false, sessions: [session("09:00", "09:15", "Daily Opening", { code: "C-DO1", type: "community" }), session("09:15", "12:00", "REACT Hooks")] }],
});
const saved = (o: Partial<SavedCalendar> = {}): SavedCalendar => ({ cohort: 13, sheet: "JSD13_Ver1", zoom_url: "https://zoom.us/j/1", weeks: [week(1, "2026-06-29", true), week(2, "2026-07-06", false)], version: 4, imported: true, imported_by: "Kan", imported_at: "2026-11-20T03:00:00Z", ...o });
const preview = (o: Partial<ImportPreview> = {}): ImportPreview => ({
  sheet: "JSD13_Ver1",
  weeks: 16,
  sessions: 457,
  warnings: [
    { level: "warn", week: 11, message: "DAY numbers repeat: the previous week starts at DAY 46 and week 11 starts at DAY 48." },
    { level: "info", week: 1, message: "Colour FF6D01 isn't in the session types key; shown as Other (15 sessions)." },
  ],
  diff: [
    { n: 1, name: "WEEK 1", status: "same", published: true, added: 0, removed: 0, lines: [] },
    { n: 2, name: "WEEK 2", status: "changed", published: false, added: 1, removed: 1, lines: ["− Mon 6 Jul 09:15–12:00 REACT Hooks", "+ Mon 6 Jul 09:15–11:00 REACT Hooks"] },
    { n: 3, name: "WEEK 3", status: "new", published: false, added: 12, removed: 0, lines: [] },
  ],
  zoom_url: "https://zoom.us/j/1",
  has_existing: true,
  saved: false,
  version: 4,
  ...o,
});
const me = (role: string) => vi.mocked(adminApi.me).mockResolvedValue({ id: "me", first_name: "Kan", staff_role: role, cohorts: [13], groups: [] } as never);
const xlsx = () => new File(["PK"], "JSD13 Calendar_internal .xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
const choose = async () => fireEvent.change(await screen.findByLabelText("Calendar spreadsheet"), { target: { files: [xlsx()] } });

describe("CalendarPage", () => {
  beforeEach(() => {
    me("owner");
    vi.mocked(calendarApi.get).mockReset().mockResolvedValue(saved());
    vi.mocked(calendarApi.import).mockReset().mockResolvedValue(preview());
    vi.mocked(calendarApi.publish).mockReset().mockResolvedValue(undefined);
    vi.mocked(calendarApi.setZoom).mockReset().mockResolvedValue(undefined);
  });

  it("invites you to import when nothing is saved yet", async () => {
    vi.mocked(calendarApi.get).mockResolvedValue(saved({ imported: false, weeks: [], zoom_url: "", version: 0 }));
    renderAdmin(<CalendarPage />, "/admin/calendar");
    expect(await screen.findByText("Import the program calendar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import from spreadsheet" })).toBeInTheDocument();
  });

  it("lists weeks and publishes one week once", async () => {
    renderAdmin(<CalendarPage />, "/admin/calendar");
    const w2 = (await screen.findByText("Week 2")).closest("li")!;
    const sw = within(w2).getByRole("switch", { name: "Publish week 2" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(within((await screen.findByText("Week 1")).closest("li")!).getByRole("switch", { name: "Publish week 1" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(sw);
    fireEvent.click(sw);
    await waitFor(() => expect(calendarApi.publish).toHaveBeenCalledTimes(1));
    expect(calendarApi.publish).toHaveBeenCalledWith(13, 2, true);
  });

  it("a viewer can look but not import or publish", async () => {
    me("viewer");
    renderAdmin(<CalendarPage />, "/admin/calendar");
    await screen.findByText("Week 2");
    await waitFor(() => expect(screen.queryByRole("switch")).toBeNull());
    expect(screen.queryByRole("button", { name: "Import from spreadsheet" })).toBeNull();
  });

  it("previews an import without saving, then saves what was previewed", async () => {
    renderAdmin(<CalendarPage />, "/admin/calendar");
    await choose();
    expect(await screen.findByText("16 weeks · 457 sessions")).toBeInTheDocument();
    expect(calendarApi.import).toHaveBeenCalledTimes(1);
    expect(calendarApi.import).toHaveBeenCalledWith(13, expect.any(File), {});
    expect(screen.getByText(/DAY numbers repeat/)).toBeInTheDocument();
    expect(screen.getByText("Changed")).toBeInTheDocument();
    expect(screen.getAllByText(/REACT Hooks/, { selector: "li" })).toHaveLength(2);
    const save = screen.getByRole("button", { name: "Save calendar" });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(calendarApi.import).toHaveBeenCalledTimes(2));
    expect(calendarApi.import).toHaveBeenLastCalledWith(13, expect.any(File), { sheet: "JSD13_Ver1", save: true, version: 4 });
  });

  it("warns when the import changes a week learners can already see", async () => {
    vi.mocked(calendarApi.import).mockResolvedValue(preview({ diff: [{ n: 1, name: "WEEK 1", status: "changed", published: true, added: 1, removed: 0, lines: ["+ Mon 29 Jun 16:00–17:00 Demo"] }] }));
    renderAdmin(<CalendarPage />, "/admin/calendar");
    await choose();
    expect(await screen.findByText(/learners can already see this week/i)).toBeInTheDocument();
  });

  it("says plainly when a published week would disappear for learners", async () => {
    vi.mocked(calendarApi.import).mockResolvedValue(preview({ diff: [{ n: 5, name: "WEEK 5", status: "removed", published: true, added: 0, removed: 20, lines: [] }, { n: 6, name: "WEEK 6", status: "removed", published: true, added: 0, removed: 18, lines: [] }, { n: 7, name: "WEEK 7", status: "removed", published: false, added: 0, removed: 10, lines: [] }] }));
    renderAdmin(<CalendarPage />, "/admin/calendar");
    await choose();
    expect(await screen.findByText("Weeks 5, 6 are published and will disappear for learners if you save.")).toBeInTheDocument();
  });

  it("asks which sheet when the file has several candidates", async () => {
    vi.mocked(calendarApi.import).mockResolvedValueOnce(preview({ sheet: "", weeks: 0, sessions: 0, warnings: [], diff: [], needs_sheet: ["JSD13_Ver1", "JSD13_Ver2"] }));
    renderAdmin(<CalendarPage />, "/admin/calendar");
    await choose();
    fireEvent.change(await screen.findByLabelText("Which sheet is JSD13's calendar?"), { target: { value: "JSD13_Ver2" } });
    await waitFor(() => expect(calendarApi.import).toHaveBeenCalledTimes(2));
    expect(calendarApi.import).toHaveBeenLastCalledWith(13, expect.any(File), { sheet: "JSD13_Ver2" });
  });

  it("shows why a file was refused", async () => {
    vi.mocked(calendarApi.import).mockRejectedValue({ response: { data: { message: 'sheet "X" not found in this file' } } });
    renderAdmin(<CalendarPage />, "/admin/calendar");
    await choose();
    expect(await screen.findByText(/sheet "X" not found/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save calendar" })).toBeNull();
  });

  it("saves the Zoom link once", async () => {
    renderAdmin(<CalendarPage />, "/admin/calendar");
    const field = await screen.findByLabelText("Zoom link");
    fireEvent.change(field, { target: { value: "https://zoom.us/j/999" } });
    const b = screen.getByRole("button", { name: "Save link" });
    fireEvent.click(b);
    fireEvent.click(b);
    await waitFor(() => expect(calendarApi.setZoom).toHaveBeenCalledTimes(1));
    expect(calendarApi.setZoom).toHaveBeenCalledWith(13, "https://zoom.us/j/999");
  });

  it("opens a week to look at its sessions", async () => {
    renderAdmin(<CalendarPage />, "/admin/calendar");
    const w1 = (await screen.findByText("Week 1")).closest("li")!;
    fireEvent.click(within(w1).getByRole("button", { name: "View week 1" }));
    expect(within(w1).getByText("REACT Hooks")).toBeInTheDocument();
    expect(within(w1).getAllByText("Kan")).toHaveLength(2);
  });
});
