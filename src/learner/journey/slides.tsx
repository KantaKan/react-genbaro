import { BarometerFace, type ZoneId } from "../today/BarometerFace";
import type { Extras, Journey, SlideId, ZoneKey } from "./types";

const BG: Record<ZoneKey, string> = { comfort: "#1e3d2c", "stretch-enjoying": "#f3d77c", "stretch-overwhelmed": "#f2a98a", panic: "#c9a8ec" };
const INK: Record<ZoneKey, string> = { comfort: "#e8f7ee", "stretch-enjoying": "#3a2c00", "stretch-overwhelmed": "#3a1608", panic: "#26113f" };
const ZONE_NAME: Record<ZoneKey, string> = { comfort: "Comfort zone", "stretch-enjoying": "Stretch, enjoying it", "stretch-overwhelmed": "Stretch, overwhelmed", panic: "Panic zone" };
const ORDER: ZoneKey[] = ["comfort", "stretch-enjoying", "stretch-overwhelmed", "panic"];
const CREAM = { background: "#f6f1e6", color: "#2a241b" };
const GREEN = { background: "#1e3d2c", color: "#e8f7ee" };

const thaiDate = (d?: string, withYear = false) =>
  d ? new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "Asia/Bangkok" }) : "";

function Face({ zone, size }: { zone: ZoneKey | "" | null; size: number }) {
  if (zone) return <BarometerFace zone={zone as ZoneId} size={size} />;
  return <i className="inline-block rounded-full" style={{ width: size, height: size, boxShadow: `inset 0 0 0 ${zone === null ? 1.5 : 2}px rgb(0 0 0 / ${zone === null ? 0.15 : 0.35})` }} />;
}

function Frame({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col px-[8%] pb-[6%] pt-[11%]" style={style}>
      {children}
    </div>
  );
}

const kicker = "text-[13px] font-semibold opacity-75";
const big = "font-extrabold leading-[0.9] tracking-tight";

export function SlideBody({ id, j, x, onHideNight }: { id: SlideId; j: Journey; x: Extras; onHideNight: () => void }) {
  switch (id) {
    case "cover":
      return (
        <Frame style={GREEN}>
          <div className={kicker}>{`BARO · JSD${j.cohort ?? ""} · Generation Thailand`}</div>
          <div className={`${big} mt-auto text-[44px]`}>
            {j.name}
            <br />
            เรียนจบแล้ว
          </div>
          <div className="mt-3 text-[14px] opacity-85">
            {`${j.weeks ?? 0} สัปดาห์ · ${j.class_days ?? 0} วันเรียน`}
            <br />
            {`${thaiDate(j.first_day)} ถึง ${thaiDate(j.last_day, true)}`}
          </div>
          <div className="mt-8 flex items-center justify-between text-[11px] font-semibold opacity-60">
            <span>แตะเพื่อดูต่อ</span>
            <Face zone="comfort" size={36} />
          </div>
        </Frame>
      );
    case "grid":
      return (
        <Frame style={CREAM}>
          <div className={kicker}>ทุกวันเรียน 1 ช่อง</div>
          <div className={`${big} mt-1.5 text-[52px]`}>
            {j.written ?? 0}
            <span className="text-[22px] font-bold opacity-50">{` / ${j.class_days ?? 0}`}</span>
          </div>
          <div className="mt-1 text-[14px] font-semibold">คืนที่คุณเขียนถึงตัวเอง</div>
          <div className="mt-auto grid w-fit grid-cols-5 gap-1">
            {(j.grid ?? []).map((g) => (
              <Face key={g.date} zone={g.zone} size={14} />
            ))}
          </div>
          <div className="mt-2.5 text-[11px] font-semibold opacity-60">ช่องว่าง = คืนที่ไม่ได้เขียน</div>
        </Frame>
      );
    case "zone": {
      const z = j.main_zone as ZoneKey;
      return (
        <Frame style={{ background: BG[z], color: INK[z] }}>
          <div className={kicker}>โซนที่คุณอยู่บ่อยที่สุด</div>
          <div className={`${big} mt-2 text-[38px]`}>{ZONE_NAME[z]}</div>
          <div className="mt-2 text-[14px]">{`${j.zone_counts?.[z] ?? 0} คืน`}</div>
          <div className="mt-auto grid gap-2">
            {ORDER.filter((k) => (j.zone_counts?.[k] ?? 0) > 0).map((k) => (
              <div key={k} className="flex items-center gap-2 text-[13px] font-semibold">
                <Face zone={k} size={18} />
                <span className="flex-1">{ZONE_NAME[k]}</span>
                <span>{j.zone_counts?.[k]}</span>
              </div>
            ))}
          </div>
        </Frame>
      );
    }
    case "week": {
      const w = j.hardest_week!;
      return (
        <Frame style={{ background: BG["stretch-overwhelmed"], color: INK["stretch-overwhelmed"] }}>
          <div className={kicker}>สัปดาห์ที่หนักที่สุด</div>
          <div className={`${big} mt-1.5 text-[72px]`}>{`W${w.number}`}</div>
          <div className="mt-1 text-[14px]">{`${thaiDate(w.from)} ถึง ${thaiDate(w.to)}`}</div>
          <div className="mt-6 flex gap-1.5">
            {w.zones.map((z, i) => (
              <Face key={i} zone={z} size={34} />
            ))}
          </div>
        </Frame>
      );
    }
    case "night": {
      const n = j.darkest_night!;
      const z = (n.zone || "panic") as ZoneKey;
      return (
        <Frame style={{ background: BG[z], color: INK[z] }}>
          <div className={kicker}>{`คืนที่หนักที่สุด · ${thaiDate(n.date)}`}</div>
          <div className="mt-4 text-[23px] font-bold leading-snug">{`"${n.text}"`}</div>
          <div className="mt-1.5 text-[12px] font-semibold opacity-70">คุณเขียนไว้</div>
          <div className="mt-auto rounded-2xl bg-white/85 px-3.5 py-3 text-[#26113f]">
            {n.reply ? (
              <>
                <div className="text-[12px] font-bold opacity-65">{n.reply_name ? `TA ${n.reply_name} ตอบ` : "TA ตอบ"}</div>
                <div className="mt-1 text-[15px] font-semibold leading-snug">{`"${n.reply}"`}</div>
              </>
            ) : (
              <div className="text-[16px] font-bold">แล้วคุณก็ผ่านมันมาได้</div>
            )}
          </div>
          <button type="button" data-no-capture onClick={(e) => (e.stopPropagation(), onHideNight())} className="mt-3 self-start text-[12px] font-semibold underline opacity-70">
            ซ่อนหน้านี้
          </button>
        </Frame>
      );
    }
    case "comeback": {
      const c = j.comeback!;
      return (
        <Frame style={GREEN}>
          <div className={kicker}>{c.after_darkest ? "หลังจากคืนนั้น" : "ต่อเนื่องที่สุด"}</div>
          <div className={`${big} mt-auto text-[128px]`}>{c.length}</div>
          <div className="mt-1 text-[18px] font-bold">
            คืนติดกัน
            <br />
            ไม่หยุดเลย
          </div>
          <div className="mt-5 flex flex-wrap gap-1">
            {Array.from({ length: Math.min(c.length, 40) }, (_, i) => (
              <Face key={i} zone="comfort" size={13} />
            ))}
          </div>
        </Frame>
      );
    }
    case "tiles": {
      const tiles: [string, string][] = [];
      if (j.attendance_rate != null) tiles.push([`${(j.attendance_rate * 100).toFixed(1)}%`, "มาเรียน"]);
      if ((j.badges ?? 0) > 0) tiles.push([String(j.badges), "badges"]);
      if (x.cupMedals > 0) tiles.push([String(x.cupMedals), "เหรียญ GenMate Cup"]);
      if ((j.ta_replies ?? 0) > 0) tiles.push([String(j.ta_replies), "คำตอบจาก TA"]);
      return (
        <Frame style={CREAM}>
          <div className={kicker}>ระหว่างทาง</div>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5">
            {tiles.map(([v, k]) => (
              <div key={k}>
                <div className={`${big} text-[40px]`}>{v}</div>
                <div className="mt-1 text-[12.5px] font-semibold">{k}</div>
              </div>
            ))}
          </div>
        </Frame>
      );
    }
    case "closing": {
      const q = j.quote!;
      return (
        <Frame style={{ background: "#e0a530", color: "#1d1405" }}>
          <div className={kicker}>ประโยคที่คุณเลือกเก็บไว้</div>
          <div className="mt-auto text-[25px] font-extrabold leading-snug">{`"${q.text}"`}</div>
          <div className="mt-2 text-[12px] font-semibold opacity-70">{thaiDate(q.date)}</div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[13px] font-bold leading-snug">
              {`ยินดีด้วย ${j.name ?? ""}`}
              <br />
              <span className="opacity-70">{`JSD${j.cohort ?? ""} · Generation Thailand`}</span>
            </div>
            <Face zone="comfort" size={32} />
          </div>
        </Frame>
      );
    }
  }
}
