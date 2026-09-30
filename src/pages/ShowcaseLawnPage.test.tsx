import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import ShowcaseLawnPage from "./ShowcaseLawnPage";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import type { BaroCharacter } from "@/application/services/baroCharacterService";

const me = "507f1f77bcf86cd799439012";
let role = "learner";
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ userId: me, userRole: role }) }));

const character: BaroCharacter = {
  id: "507f1f77bcf86cd799439011", owner_id: me, serial: "B-507F1F77BCF86CD799439011",
  dna: { version: 1, body: "bean", ears: "cat", eyes: "wide", mark: "heart", palette: "Mint", pattern: "egg", pattern_seed: 12345, rarity: "meme_rare" },
  fingerprint: "fingerprint", source: "starter", is_starter: true, created_at: "2026-09-29T00:00:00Z",
};
const entry = (ownerId: string, name: string, cohort: number, team: string) => ({ owner_id: ownerId, name, cohort, team, character: { ...character, owner_id: ownerId, id: ownerId, serial: `B-${ownerId}` }, message: "Hi from the lawn", updated_at: "2026-09-29T00:00:00Z", hidden: false });
let entries: ShowcaseEntry[] = [entry("peer-alpha", "Mali", 16, "Alpha"), entry("peer-beta", "Pim", 16, "Beta"), entry("peer-other", "Nok", 17, "Alpha")];
let selection = { equipped_id: character.id, pinned_id: "" };
let failList = false;
let moodRequests: unknown[] = [];
let emoteRequests: unknown[] = [];
let activeReactions = new Set<string>();
let godEvents: Array<{ id: string; preset: string; caption: string; cohort: number; cast_by: string; character: typeof character; created_at: string; active_until: string; active: boolean }> = [];
const reactionChoices = ["❤️", "✨", "😂", "🙌"];
const server = setupServer(
  http.get("*/god-events", () => HttpResponse.json({ data: godEvents.filter((item) => role === "admin" || item.cohort === 0 || item.cohort === 16) })),
  http.get("*/cohorts", () => HttpResponse.json({ data: [{ cohortNumber: 16 }, { cohortNumber: 17 }] })),
  http.post("*/admin/god-events", async ({ request }) => {
    const body = await request.json() as { preset: string; caption: string; cohort: number };
    if (role !== "admin") return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
    const created = { ...body, id: `event-${godEvents.length + 1}`, cast_by: me, character, created_at: "2026-09-29T00:00:00Z", active_until: "2026-09-30T00:00:00Z", active: true };
    godEvents = [created, ...godEvents];
    return HttpResponse.json({ data: created }, { status: 201 });
  }),
  http.get("*/baro-characters", () => HttpResponse.json({ data: [character] })),
  http.get("*/baro-characters/selection", () => HttpResponse.json({ data: selection })),
  http.get("*/showcase-lawn/me", () => HttpResponse.json({ data: entries.find((item) => item.owner_id === me) ?? null })),
  http.get("*/showcase-lawn", ({ request }) => {
    if (failList) return HttpResponse.json({ message: "unavailable" }, { status: 500 });
    const query = new URL(request.url).searchParams;
    const cohort = role === "admin" ? Number(query.get("cohort") || 0) : 16;
    const team = query.get("team") || "";
    const includeHidden = role === "admin" && query.get("include_hidden") === "true";
    return HttpResponse.json({ data: entries.filter((item) => (!cohort || item.cohort === cohort) && (!team || item.team === team) && (includeHidden || !item.hidden)).map((item) => ({ ...item, reactions: reactionChoices.map((emoji) => ({ emoji, count: [...activeReactions].filter((key) => key.startsWith(`${item.owner_id}:`) && key.endsWith(`:${emoji}`)).length, reacted: activeReactions.has(`${item.owner_id}:${me}:${emoji}`) })) })) });
  }),
  http.put("*/showcase-lawn/me", async ({ request }) => {
    const body = await request.json() as { character_id: string; message: string };
    selection = { ...selection, pinned_id: body.character_id };
    entries = entries.filter((item) => item.owner_id !== me).concat({ ...entry(me, "Me", 16, "Alpha"), character, message: body.message, hidden: entries.find((item) => item.owner_id === me)?.hidden ?? false });
    return HttpResponse.json({ data: { saved: true } });
  }),
  http.put("*/showcase-lawn/me/mood", async ({ request }) => {
    const body = await request.json() as { mood: ShowcaseEntry["mood"] | "" };
    moodRequests.push(body);
    const until = "2099-01-01T00:00:00Z";
    entries = entries.map((item) => item.owner_id === me ? { ...item, mood: body.mood || undefined, mood_until: body.mood ? until : undefined } : item);
    return HttpResponse.json({ data: { mood: body.mood, until } });
  }),
  http.put("*/showcase-lawn/me/emote", async ({ request }) => {
    const body = await request.json() as { emote: ShowcaseEntry["emote"] | ""; target: string };
    emoteRequests.push(body);
    const until = "2099-01-01T00:00:00Z";
    entries = entries.map((item) => item.owner_id === me ? { ...item, emote: body.emote || undefined, emote_target: body.target || undefined, emote_until: body.emote ? until : undefined } : item);
    return HttpResponse.json({ data: { emote: body.emote, target: body.target, until } });
  }),
  http.delete("*/showcase-lawn/me", () => {
    entries = entries.filter((item) => item.owner_id !== me);
    selection = { ...selection, pinned_id: "" };
    return HttpResponse.json({ data: { removed: true } });
  }),
  http.post("*/showcase-lawn/:ownerId/reactions", async ({ params, request }) => {
    const body = await request.json() as { emoji: string };
    const key = `${params.ownerId}:${me}:${body.emoji}`;
    if (activeReactions.has(key)) activeReactions.delete(key);
    else activeReactions.add(key);
    return HttpResponse.json({ data: { reacted: activeReactions.has(key) } });
  }),
  http.put("*/admin/showcase-lawn/:ownerId/moderation", async ({ params, request }) => {
    const body = await request.json() as { hidden: boolean };
    entries = entries.map((item) => item.owner_id === params.ownerId ? { ...item, hidden: body.hidden } : item);
    return HttpResponse.json({ data: { hidden: body.hidden } });
  }),
);

beforeAll(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => { moodRequests = []; emoteRequests = []; server.resetHandlers(); role = "learner"; failList = false; activeReactions = new Set<string>(); godEvents = []; selection = { equipped_id: character.id, pinned_id: "" }; entries = [entry("peer-alpha", "Mali", 16, "Alpha"), entry("peer-beta", "Pim", 16, "Beta"), entry("peer-other", "Nok", 17, "Alpha")]; });
afterAll(() => server.close());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}><ShowcaseLawnPage /></QueryClientProvider></MemoryRouter>);
}

async function openPanel() {
  fireEvent.click(await screen.findByRole("button", { name: /คู่หูของฉัน$/ }));
}

async function openCard(name: string) {
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(`^${name} · `) }));
  return screen.findByRole("dialog", { name: `การ์ดของ ${name}` });
}

describe("ShowcaseLawnPage", { timeout: 20_000 }, () => {
  it("lets an admin cast all three scenes to a cohort and replay the history", async () => {
    role = "admin";
    renderPage();
    for (const [title, preset] of [["ฝนดาว", "star_rain"], ["เทพลงลาน", "god_entrance"], ["ขบวนเพื่อนจิ๋ว", "character_parade"]]) {
      await openPanel();
      expect(await screen.findByText("แคสต์เรื่องใหม่บนลาน")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${title}`) }));
      fireEvent.change(screen.getByLabelText("ข้อความจากแอดมิน"), { target: { value: `${title} มาแล้ว` } });
      fireEvent.change(screen.getByLabelText("ให้ใครเห็น"), { target: { value: "16" } });
      fireEvent.click(screen.getByRole("button", { name: "ปล่อยเหตุการณ์ ✨" }));
      await waitFor(() => expect(godEvents[0]?.preset).toBe(preset));
      await waitFor(() => expect(screen.getByRole("region", { name: new RegExp(title) })).toBeInTheDocument());
    }
    expect(godEvents.every((event) => event.cohort === 16)).toBe(true);
    await openPanel();
    fireEvent.click(await screen.findByRole("button", { name: "ดูซ้ำ ฝนดาว มาแล้ว" }));
    expect(screen.getByRole("region", { name: "เล่นซ้ำ: ฝนดาว" })).toHaveTextContent("ฝนดาว มาแล้ว");
    fireEvent.click(screen.getByRole("button", { name: "ปิดการเล่นซ้ำ" }));
    expect(screen.getByRole("region", { name: "กำลังเกิดขึ้น: ขบวนเพื่อนจิ๋ว" })).toBeInTheDocument();
  });

  it("keeps expired history replayable and hides cast controls from learners", async () => {
    godEvents = [{ id: "old", preset: "god_entrance", caption: "วันดี ๆ ของเรา", cohort: 16, cast_by: me, character, created_at: "2026-09-27T00:00:00Z", active_until: "2026-09-28T00:00:00Z", active: false }];
    renderPage();
    await openPanel();
    expect(await screen.findByRole("button", { name: "ดูซ้ำ วันดี ๆ ของเรา" })).toBeInTheDocument();
    expect(screen.queryByText("แคสต์เรื่องใหม่บนลาน")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ดูซ้ำ วันดี ๆ ของเรา" }));
    expect(screen.getByRole("region", { name: "เล่นซ้ำ: เทพลงลาน" })).toHaveTextContent("วันดี ๆ ของเรา");
  });

  it("blocks unsafe captions in the composer and uses motion-safe scene effects", async () => {
    role = "admin";
    godEvents = [{ id: "stars", preset: "star_rain", caption: "ดาวสำหรับทุกคน", cohort: 0, cast_by: me, character, created_at: "2026-09-29T00:00:00Z", active_until: "2026-09-30T00:00:00Z", active: true }];
    renderPage();
    expect(await screen.findByRole("region", { name: "กำลังเกิดขึ้น: ฝนดาว" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "กำลังเกิดขึ้น: ฝนดาว" }).querySelector(".motion-safe\\:animate-pulse")).not.toBeNull();
    await openPanel();
    fireEvent.change(screen.getByLabelText("ข้อความจากแอดมิน"), { target: { value: "<script>" } });
    expect(screen.getByRole("button", { name: "ปล่อยเหตุการณ์ ✨" })).toBeDisabled();
  });

  it("filters a learner's cohort to their team and supports pin, edit, and removal", async () => {
    renderPage();
    expect(await screen.findByText("Mali")).toBeInTheDocument();
    expect(screen.getByText("Pim")).toBeInTheDocument();
    expect(screen.queryByText("Nok")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("กรองทีม"), { target: { value: "Alpha" } });
    await waitFor(() => expect(screen.queryByText("Pim")).not.toBeInTheDocument());
    await openPanel();
    fireEvent.change(await screen.findByLabelText("ฝากข้อความไว้บนลาน"), { target: { value: "Hi friends!" } });
    fireEvent.click(screen.getByRole("button", { name: "ปักบนลาน" }));
    await waitFor(() => expect(selection.pinned_id).toBe(character.id));
    expect(within(await openCard("Me")).getByText("Hi friends!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ปิดการ์ด" }));
    fireEvent.change(screen.getByLabelText("ฝากข้อความไว้บนลาน"), { target: { value: "New note" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกการปัก" }));
    await waitFor(() => expect(entries.find((item) => item.owner_id === me)?.message).toBe("New note"));
    await waitFor(async () => expect(within(await openCard("Me")).getByText("New note")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "ปิดการ์ด" }));
    fireEvent.click(screen.getByRole("button", { name: "เอาออกจากลาน" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /^Me · / })).not.toBeInTheDocument());
    expect(selection.pinned_id).toBe("");
  });

  it("allows an admin to browse all cohorts and then select one", async () => {
    role = "admin";
    renderPage();
    expect(await screen.findByText("Nok")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("กรองรุ่น"), { target: { value: "16" } });
    await waitFor(() => expect(screen.queryByText("Nok")).not.toBeInTheDocument());
    expect(screen.getByText("Mali")).toBeInTheDocument();
  });

  it("opens the same pinned character and equipped prop in the 2D fallback when WebGL is unavailable", async () => {
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    entries = [{ ...entry("peer-alpha", "Mali", 16, "Alpha"), prop: "egg" }];
    renderPage();
    fireEvent.click(within(await openCard("Mali")).getByRole("button", { name: "ดูคู่หู 3D" }));
    const dialog = await screen.findByRole("dialog", { name: "ดูตัวละครของ Mali" });
    expect(within(dialog).getByRole("img", { name: /Baro Character Mint egg/ })).toHaveAttribute("data-character-prop", "egg");
    expect(within(dialog).getByText("เครื่องนี้แสดงภาพ 2D แทนได้ครบ")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "3D" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "ปิดตัวละคร" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    context.mockRestore();
  });

  it("gives a retry action when the lawn cannot load", async () => {
    failList = true;
    renderPage();
    expect(await screen.findByRole("alert", { name: "" })).toHaveTextContent("ยังเปิดลานไม่ได้");
    failList = false;
    fireEvent.click(screen.getByRole("button", { name: /โหลดใหม่/ }));
    expect(await screen.findByText("Mali")).toBeInTheDocument();
  });

  it("invites the first pin when the cohort lawn is empty", async () => {
    entries = [];
    renderPage();
    expect(await screen.findByText("ยังไม่มีใครปักตัวละครตรงนี้")).toBeInTheDocument();
    await openPanel();
    expect(await screen.findByRole("button", { name: "ปักบนลาน" })).toBeEnabled();
  });

  it("toggles each supported reaction without accumulating duplicate counts", async () => {
    renderPage();
    await openCard("Mali");
    const heart = await screen.findByRole("button", { name: "ส่ง ❤️ ให้ Mali" });
    expect(screen.queryByRole("button", { name: "ซ่อนจากลาน" })).not.toBeInTheDocument();
    fireEvent.click(heart);
    await waitFor(() => expect(screen.getByRole("button", { name: "ส่ง ❤️ ให้ Mali" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByRole("button", { name: "ส่ง ❤️ ให้ Mali" })).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "ส่ง ❤️ ให้ Mali" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "ส่ง ❤️ ให้ Mali" })).toHaveAttribute("aria-pressed", "false"));
    expect(screen.getByRole("button", { name: "ส่ง ❤️ ให้ Mali" })).toHaveTextContent("0");
  });

  it("lets an admin hide and restore a card while public visitors cannot see it", async () => {
    role = "admin";
    const adminView = renderPage();
    expect(await screen.findByText("Mali")).toBeInTheDocument();
    fireEvent.click(within(await openCard("Mali")).getByRole("button", { name: "ซ่อนจากลาน" }));
    await waitFor(() => expect(entries.find((item) => item.owner_id === "peer-alpha")?.hidden).toBe(true));
    adminView.unmount();
    role = "learner";
    const learnerView = renderPage();
    expect(await screen.findByText("Pim")).toBeInTheDocument();
    expect(screen.queryByText("Mali")).not.toBeInTheDocument();
    learnerView.unmount();
    role = "admin";
    renderPage();
    fireEvent.click(within(await openCard("Mali")).getByRole("button", { name: "คืนสู่ลาน" }));
    await waitFor(() => expect(entries.every((item) => !item.hidden)).toBe(true));
  });

  it("lets an owner edit their own hidden message without exposing it on the lawn", async () => {
    entries.push({ ...entry(me, "Me", 16, "Alpha"), character, hidden: true, message: "Original note" });
    selection = { ...selection, pinned_id: character.id };
    renderPage();
    await openPanel();
    expect(await screen.findByText(/แอดมินซ่อนจากลาน/)).toBeInTheDocument();
    expect(screen.getByLabelText("ฝากข้อความไว้บนลาน")).toHaveValue("Original note");
    expect(screen.queryByText("Me")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("ฝากข้อความไว้บนลาน"), { target: { value: "Edited note" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกการปัก" }));
    await waitFor(() => expect(entries.find((item) => item.owner_id === me)?.message).toBe("Edited note"));
    expect(entries.find((item) => item.owner_id === me)?.hidden).toBe(true);
    expect(screen.queryByText("Me")).not.toBeInTheDocument();
  });

  it("shows at most twelve cohort friends, always including my own pin, and explains the rotation", async () => {
    entries = Array.from({ length: 20 }, (_, index) => entry(`peer-${index}`, `Friend ${index}`, 16, index % 2 ? "Alpha" : "Beta"));
    entries.push({ ...entry(me, "Me", 16, "Alpha"), character });
    selection = { ...selection, pinned_id: character.id };
    renderPage();
    const scene = await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้/ });
    expect(within(scene).getAllByRole("button", { name: / · / })).toHaveLength(12);
    expect(scene).toHaveAttribute("data-scene", "backyard");
    expect(within(scene).getByRole("button", { name: /^Me · / })).toBeInTheDocument();
    expect(screen.getByText(/12 จาก 21 คน/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("กรองทีม"), { target: { value: "Beta" } });
    await waitFor(() => expect(within(screen.getByRole("group", { name: /^เพื่อนบนลานตอนนี้/ })).queryByRole("button", { name: /^Friend 1 · / })).not.toBeInTheDocument());
    expect(within(screen.getByRole("group", { name: /^เพื่อนบนลานตอนนี้/ })).getByRole("button", { name: /^Me · / })).toBeInTheDocument();
  });

  it("lets a pinned learner choose, change, and clear a 24-hour mood without naming anyone", async () => {
    entries.push({ ...entry(me, "Me", 16, "Alpha"), character });
    selection = { ...selection, pinned_id: character.id };
    renderPage();
    await screen.findByRole("button", { name: /^Me · / });
    await openPanel();
    const quiet = await screen.findByRole("button", { name: "🤫 ขอเวลาเงียบ ๆ" });
    expect(screen.getByText(/อยู่ 24 ชั่วโมงแล้วกลับเป็นปกติเอง/)).toBeInTheDocument();
    fireEvent.click(quiet);
    await waitFor(() => expect(screen.getByRole("button", { name: "🤫 ขอเวลาเงียบ ๆ" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByText("คู่หูจะเดิน นั่ง หรืองีบคนเดียว ไม่ถูกจับคู่กับใคร")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "🎈 อยากเล่นสนุก" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "🎈 อยากเล่นสนุก" })).toHaveAttribute("aria-pressed", "true"));
    fireEvent.click(screen.getByRole("button", { name: "กลับเป็นปกติ" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "กลับเป็นปกติ" })).not.toBeInTheDocument());
    expect(moodRequests).toEqual([{ mood: "quiet" }, { mood: "playful" }, { mood: "" }]);
  });

  it("does not offer a mood before the learner pins a character", async () => {
    renderPage();
    await openPanel();
    expect(await screen.findByRole("button", { name: "ปักบนลาน" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "🤫 ขอเวลาเงียบ ๆ" })).not.toBeInTheDocument();
  });

  it("uses a six-character light lawn on constrained devices and lets learners switch it", async () => {
    const cores = Object.getOwnPropertyDescriptor(Navigator.prototype, "hardwareConcurrency");
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, value: 2 });
    try {
      entries = Array.from({ length: 20 }, (_, index) => entry(`peer-${index}`, `Friend ${index}`, 16, "Alpha"));
      entries.push({ ...entry(me, "Me", 16, "Alpha"), character });
      renderPage();
      const scene = await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้/ });
      expect(within(scene).getAllByRole("button", { name: / · / })).toHaveLength(6);
      expect(within(scene).getByRole("button", { name: /^Me · / })).toBeInTheDocument();
      const lite = screen.getByRole("button", { name: "ลานแบบเบา" });
      expect(lite).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(lite);
      expect(within(scene).getAllByRole("button", { name: / · / })).toHaveLength(12);
    } finally {
      delete (navigator as { hardwareConcurrency?: number }).hardwareConcurrency;
      if (cores) Object.defineProperty(Navigator.prototype, "hardwareConcurrency", cores);
    }
  });

  it("shows an active God Event as a shared lawn layer without changing anyone's choreography", async () => {
    entries = Array.from({ length: 8 }, (_, index) => entry(`peer-${index}`, `Friend ${index}`, 16, "Alpha"));
    const quietView = renderPage();
    const quietScene = await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้/ });
    const choreography = () => within(screen.getByRole("group", { name: /^เพื่อนบนลานตอนนี้/ })).getAllByRole("button", { name: / · / }).map((button) => `${button.getAttribute("aria-label")}:${button.dataset.pose}`).sort();
    expect(quietScene).toBeInTheDocument();
    const before = choreography();
    quietView.unmount();
    godEvents = [{ id: "event-1", preset: "star_rain", caption: "ดาวตกให้ทุกคน", cohort: 16, cast_by: "admin", character, created_at: "2026-09-29T00:00:00Z", active_until: "2099-01-01T00:00:00Z", active: true }];
    renderPage();
    expect(await screen.findByRole("region", { name: "กำลังเกิดขึ้น: ฝนดาว" })).toHaveTextContent("ดาวตกให้ทุกคน");
    await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้/ });
    expect(choreography()).toEqual(before);
    expect(document.querySelector('[data-god-event-layer="star_rain"]')).toHaveAttribute("aria-hidden", "true");
  });

  it("never leaks a hidden entry's name or message to learners and never records choreography", async () => {
    const writes: string[] = [];
    const record = ({ request }: { request: Request }) => { if (request.method !== "GET") writes.push(`${request.method} ${new URL(request.url).pathname}`); };
    server.events.on("request:start", record);
    try {
      entries = [entry("peer-alpha", "Mali", 16, "Alpha"), { ...entry("peer-hidden", "Secret Sam", 16, "Alpha"), hidden: true, message: "unsafe words" }];
      renderPage();
      await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้/ });
      expect(screen.queryByText("Secret Sam")).not.toBeInTheDocument();
      expect(screen.queryByText("unsafe words")).not.toBeInTheDocument();
      expect(await openCard("Mali")).not.toHaveTextContent("unsafe words");
      expect(writes).toEqual([]);
    } finally {
      server.events.removeListener("request:start", record);
    }
  });

  it("lets a learner choose a yard scene and remembers it on the next visit", async () => {
    window.localStorage.removeItem("baro.lawn.yard-scene");
    const first = renderPage();
    expect(await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้ · สวนหลังบ้าน/ })).toHaveAttribute("data-scene", "backyard");
    expect(screen.getByRole("button", { name: "สวนหลังบ้าน" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "เกาะลอยฟ้า" }));
    expect(await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้ · เกาะลอยฟ้า/ })).toHaveAttribute("data-scene", "island");
    expect(within(screen.getByRole("group", { name: /^เพื่อนบนลานตอนนี้/ })).getByRole("button", { name: /^Mali · / })).toBeInTheDocument();
    first.unmount();
    renderPage();
    expect(await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้ · เกาะลอยฟ้า/ })).toBeInTheDocument();
    window.localStorage.removeItem("baro.lawn.yard-scene");
  });

  it("falls back to the backyard when the saved yard is unknown or storage is blocked", async () => {
    window.localStorage.setItem("baro.lawn.yard-scene", "moon-base");
    const view = renderPage();
    expect(await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้ · สวนหลังบ้าน/ })).toBeInTheDocument();
    view.unmount();
    const realGet = Storage.prototype.getItem;
    const realSet = Storage.prototype.setItem;
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key: string) { if (key === "baro.lawn.yard-scene") throw new Error("blocked"); return realGet.call(this, key); });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) { if (key === "baro.lawn.yard-scene") throw new Error("blocked"); realSet.call(this, key, value); });
    try {
      renderPage();
      expect(await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้ · สวนหลังบ้าน/ })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "ระเบียงบ้าน" }));
      expect(await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้ · ระเบียงบ้าน/ })).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
      window.localStorage.removeItem("baro.lawn.yard-scene");
    }
  });

  it("hides classmates' names until focus while keeping my own tag visible", async () => {
    entries.push({ ...entry(me, "Me", 16, "Alpha"), character });
    renderPage();
    const scene = await screen.findByRole("group", { name: /^เพื่อนบนลานตอนนี้/ });
    expect(within(scene).getByText("คุณ · Me")).toBeInTheDocument();
    expect(within(scene).getByText("Mali", { selector: "span" }).className).toContain("opacity-0");
  });

  it("lets a pinned learner play an emote and visit a friend by tapping them", async () => {
    entries.push({ ...entry(me, "Me", 16, "Alpha"), character });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "เต้น" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Me · / })).toHaveAttribute("data-action", "dance"));
    expect(screen.getByRole("button", { name: "เต้น" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "ไปหาเพื่อน" }));
    expect(screen.getByRole("status")).toHaveTextContent("แตะเพื่อนที่อยากไปแปะมือด้วย");
    fireEvent.click(screen.getByRole("button", { name: /^Mali · / }));
    await waitFor(() => expect(emoteRequests).toEqual([{ emote: "dance", target: "" }, { emote: "visit", target: "peer-alpha" }]));
    expect(screen.queryByRole("dialog", { name: "การ์ดของ Mali" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /^Me · / })).toHaveAttribute("data-action", "high-five"));
  });

  it("does not offer emotes before the learner pins a character", async () => {
    renderPage();
    await screen.findByRole("button", { name: /^Mali · / });
    expect(screen.queryByRole("button", { name: "เต้น" })).not.toBeInTheDocument();
  });
});
