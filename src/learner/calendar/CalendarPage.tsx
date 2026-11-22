import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import { TYPE_DOT, TYPE_LABEL, toMin, type CalDay, type Session } from "@/calendar/types";
import { weekLabel } from "@/calendar/week";
import { learnerApi } from "../api";
import { usePageHeader } from "../shell/LearnerShell";
import { bangkokNow } from "../lib/time";
import { defaultDay, durationLabel, hoursByType, momentAt, pickWeek, upcoming } from "./logic";

const card = "rounded-2xl bg-l-card p-5 shadow-[0_0_0_1px_var(--l-hair)]";
const dayShort = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
const dayNum = (d: string) => Number(d.slice(8, 10));
const dur = (s: Session) => toMin(s.end) - toMin(s.start);

function Dot({ type }: { type: string }) {
  return <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ background: TYPE_DOT[type] ?? TYPE_DOT.other }} title={TYPE_LABEL[type]} />;
}

export function CalendarPage() {
  const { userData } = useUserData();
  const q = useQuery(["learner-calendar"], learnerApi.getCalendar, { refetchOnWindowFocus: true });
  const [tick, setTick] = useState(() => bangkokNow());
  const [weekN, setWeekN] = useState<number | null>(null);
  const [dayDate, setDayDate] = useState<string | null>(null);
  useEffect(() => {
    const id = setInterval(() => setTick(bangkokNow()), 30_000);
    return () => clearInterval(id);
  }, []);
  usePageHeader({ title: "Schedule", context: `JSD${userData?.cohort_number ?? ""}` });

  if (q.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-l-sub" />;
  if (q.isError || !q.data) {
    return (
      <section className={`${card} text-center`}>
        <h2 className="text-[15px] font-semibold">Couldn't load your schedule</h2>
        <button type="button" onClick={() => q.refetch()} className="mt-3 rounded-full bg-l-ink px-5 py-2 text-[13px] font-medium text-l-card">
          Try again
        </button>
      </section>
    );
  }

  const { weeks, zoom_url } = q.data;
  if (weeks.length === 0) {
    return (
      <section className={`${card} mx-auto max-w-[520px] text-center`}>
        <CalendarDays className="mx-auto h-7 w-7 text-l-ink3" strokeWidth={1.4} />
        <h2 className="mt-2 text-[16px] font-semibold">Your schedule isn't ready yet</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-l-ink2">Your program team publishes the calendar one week at a time. It shows up here as soon as a week is published.</p>
      </section>
    );
  }

  const { date: today, minutes: min } = tick;
  const sorted = [...weeks].sort((a, b) => a.n - b.n);
  const week = sorted.find((w) => w.n === weekN) ?? pickWeek(sorted, today)!;
  const wi = sorted.findIndex((w) => w.n === week.n);
  const selected = dayDate && week.days.some((d) => d.date === dayDate) ? dayDate : defaultDay(week, today);
  const day: CalDay | undefined = week.days.find((d) => d.date === selected);
  const todayDay = sorted.flatMap((w) => w.days).find((d) => d.date === today);
  const moment = momentAt(todayDay, min);
  const comingWeek = pickWeek(sorted, today);
  const coming = comingWeek ? upcoming(comingWeek, today, min, 4) : [];
  const mix = hoursByType(week);
  const mixTotal = mix.reduce((n, m) => n + m.minutes, 0) || 1;
  const zoom = zoom_url.startsWith("https://") ? zoom_url : "";
  const goWeek = (n: number) => {
    setWeekN(n);
    setDayDate(null);
  };

  const zoomLink = zoom && (
    <a href={zoom} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-l-ink px-4 py-2 text-[13px] font-medium text-l-card">
      Join Zoom
    </a>
  );
  const who = (s: Session) => (s.facilitators.length > 0 ? s.facilitators.join(" · ") : "");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className={card}>
        <div className="flex items-center gap-2.5">
          <button type="button" aria-label="Previous week" disabled={wi <= 0} onClick={() => goWeek(sorted[wi - 1].n)} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)] disabled:opacity-35">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-[17px] font-semibold tracking-tight">
            Week {week.n} <span className="font-medium text-l-ink3">· {weekLabel(week.monday)}</span>
          </h2>
          <button type="button" aria-label="Next week" disabled={wi >= sorted.length - 1} onClick={() => goWeek(sorted[wi + 1].n)} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)] disabled:opacity-35">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {wi >= sorted.length - 1 && <p className="mt-1 text-xs text-l-ink3">Later weeks appear when they're published.</p>}

        <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1.5 pt-1">
          {week.days.map((d) => {
            const on = d.date === selected;
            return (
              <button
                key={d.date}
                type="button"
                aria-pressed={on}
                onClick={() => setDayDate(d.date)}
                className={`flex min-w-[64px] flex-1 flex-col items-center rounded-xl px-2 py-2 text-center transition-colors ${on ? "bg-l-ink text-l-card" : d.date < today ? "text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)]" : "shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub"}`}
              >
                <span className="text-[11.5px] font-medium">
                  {dayShort(d.date)} {dayNum(d.date)}
                </span>
                {d.date === today ? <span className="mt-0.5 text-[10.5px] font-semibold opacity-80">Today</span> : d.holiday ? <span className="mt-0.5 text-[10.5px] font-medium opacity-70">Holiday</span> : <span className="mt-0.5 text-[10.5px] opacity-0">.</span>}
              </button>
            );
          })}
        </div>

        <section aria-label="Agenda" className="mt-4">
          {!day || (day.sessions.length === 0 && !day.holiday) ? (
            <p className="py-6 text-center text-[13.5px] text-l-ink3">Nothing scheduled this day.</p>
          ) : day.holiday ? (
            <p className="py-6 text-center text-[13.5px] text-l-ink2">No class this day (holiday).</p>
          ) : (
            <ul className="flex flex-col">
              {day.sessions.map((s, i) => {
                const past = day.date < today || (day.date === today && toMin(s.end) <= min);
                const isNow = day.date === today && toMin(s.start) <= min && min < toMin(s.end) && s.kind === "session";
                const isBreak = s.kind === "break";
                return (
                  <li key={i} aria-current={isNow ? "true" : undefined} className={`flex gap-3 border-b border-l-hair py-3 last:border-0 ${past ? "opacity-55" : ""} ${isNow ? "-mx-2 rounded-xl bg-l-sub px-2" : ""}`}>
                    <span className="w-11 shrink-0 pt-px text-[13px] font-semibold tabular-nums text-l-ink2">{s.start}</span>
                    <Dot type={s.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <b className={`text-[14px] ${isBreak ? "font-medium text-l-ink3" : "font-semibold"}`}>{s.title}</b>
                        {s.code && <small className="text-xs text-l-ink3">{s.code}</small>}
                        {isNow && <span className="rounded-full bg-l-ink px-2 py-0.5 text-[10.5px] font-semibold text-l-card">Now</span>}
                      </div>
                      {s.subtitle && <div className="text-xs text-l-ink3">{s.subtitle}</div>}
                      {!isBreak && who(s) && <div className="mt-0.5 text-xs text-l-ink2">{s.facilitators.length === 1 ? <span>{s.facilitators[0]}</span> : who(s)}</div>}
                    </div>
                    <span className="shrink-0 pt-px text-xs tabular-nums text-l-ink3">{durationLabel(dur(s))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>

      <div className="flex flex-col gap-4">
        <section aria-label="Now and next" className={card}>
          {todayDay?.holiday ? (
            <>
              <h3 className="text-[15px] font-semibold">No class today</h3>
              <p className="mt-1 text-[13px] text-l-ink2">It's a holiday. Enjoy it!</p>
            </>
          ) : moment.now ? (
            <>
              <span className="rounded-full bg-l-ink px-2 py-0.5 text-[10.5px] font-semibold text-l-card">Now</span>
              <h3 className="mt-2 text-[17px] font-semibold leading-snug">{moment.now.title}</h3>
              {moment.now.code && <small className="text-xs text-l-ink3">{moment.now.code}</small>}
              <p className="mt-1 text-[13px] text-l-ink2">ends in {durationLabel(moment.minsLeft ?? 0)}</p>
              {who(moment.now) && <p className="mt-0.5 text-xs text-l-ink3">{who(moment.now)}</p>}
              {zoomLink}
            </>
          ) : moment.next ? (
            <>
              <span className="rounded-full bg-l-sub px-2 py-0.5 text-[10.5px] font-semibold text-l-ink2">Next up</span>
              <h3 className="mt-2 text-[17px] font-semibold leading-snug">{moment.next.title}</h3>
              <p className="mt-1 text-[13px] text-l-ink2">
                at {moment.next.start} · in {durationLabel(moment.minsToNext ?? 0)}
              </p>
              {who(moment.next) && <p className="mt-0.5 text-xs text-l-ink3">{who(moment.next)}</p>}
              {(moment.minsToNext ?? 99) <= 30 && zoomLink}
            </>
          ) : (
            <>
              <h3 className="text-[15px] font-semibold">{todayDay ? "That's all for today" : "Nothing scheduled today"}</h3>
              <p className="mt-1 text-[13px] text-l-ink2">{todayDay ? "See you next class." : "Pick a day on the left to see what's coming."}</p>
            </>
          )}
        </section>

        {coming.length > 0 && (
          <section aria-label="Coming up" className={card}>
            <h3 className="text-[13px] font-semibold">Coming up this week</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {coming.map((u, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[13px]">
                  <span className="w-[68px] shrink-0 text-xs tabular-nums text-l-ink3">
                    {dayShort(u.date)} {u.session.start}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{u.session.title}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mix.length > 0 && (
          <section aria-label="This week" className={card}>
            <h3 className="text-[13px] font-semibold">This week</h3>
            <p className="text-xs text-l-ink3">Time by session type</p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-l-sub">
              {mix.map((m) => (
                <div key={m.type} style={{ width: `${(m.minutes / mixTotal) * 100}%`, background: TYPE_DOT[m.type] ?? TYPE_DOT.other }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {mix.map((m) => (
                <li key={m.type} className="flex items-center gap-2 text-[12.5px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: TYPE_DOT[m.type] ?? TYPE_DOT.other }} />
                  <span className="flex-1">{TYPE_LABEL[m.type] ?? m.type}</span>
                  <span className="tabular-nums text-l-ink3">{durationLabel(m.minutes)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
