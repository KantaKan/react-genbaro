import { useState } from "react";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FeedbackForm from "@/components/linear-feedback-form";
import { useReflections, type Reflection as HookReflection } from "@/hooks/use-reflections";
import type { Reflection } from "@/domain/types";
import { reflectionZones } from "@/components/reflection-zones";
import { BarometerFace, ZONES, type ZoneId } from "./BarometerFace";
import { Bone } from "@/components/LoadingSkeleton";

const OPENS = 16 * 3600 + 45 * 60;

export function ReflectionCard({
  userId,
  reflections,
  nowSec,
  today,
  onSubmitted,
}: {
  userId: string;
  reflections: Reflection[];
  nowSec: number;
  today: string;
  onSubmitted: () => void;
}) {
  const { addReflection } = useReflections(userId, reflections as unknown as HookReflection[]);
  const [picked, setPicked] = useState<ZoneId | null>(null);
  const open = nowSec >= OPENS;
  const todays = reflections.find((r) => (r.day || r.date || "").slice(0, 10) === today);
  const zoneOf = (label: string) => reflectionZones.find((z) => z.label.toLowerCase() === label.toLowerCase())?.id as ZoneId | undefined;
  const sentZone = todays ? zoneOf(todays.reflection.barometer) : undefined;
  const latest = [...reflections].filter((r) => r !== todays).sort((a, b) => (b.date > a.date ? 1 : -1))[0];
  const left = Math.max(0, OPENS - nowSec);

  return (
    <section className="l-card p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-title font-semibold">Daily reflection</h3>
          <p className="mt-0.5 text-small text-l-ink3">Learning barometer</p>
        </div>
        <Link to="/learner/reflections" className="-m-2 rounded-lg p-2 text-body font-medium text-l-ink2 hover:bg-l-sub">
          History ›
        </Link>
      </div>

      {todays && sentZone ? (
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl p-3.5" style={{ background: ZONES.find((z) => z.id === sentZone)?.soft }}>
          <BarometerFace zone={sentZone} size={52} />
          <div>
            <div className="text-title font-semibold text-zinc-900">Sent. Thanks for reflecting today.</div>
            <div className="mt-0.5 text-small text-zinc-600">
              {todays.reflection.barometer}.{" "}
              {sentZone === "stretch-overwhelmed" || sentZone === "panic" ? "A TA will reach out. You don't have to figure it out alone." : "See you tomorrow."}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 text-xl font-semibold tracking-tight">Where are you today?</div>
          <div className="mt-3.5 grid grid-cols-4 gap-2">
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                disabled={!open}
                onClick={() => setPicked(z.id)}
                className="flex flex-col items-center gap-2 rounded-2xl px-1 pb-2.5 pt-3 text-center text-small leading-tight text-l-ink2 transition duration-300 enabled:hover:-translate-y-0.5 enabled:hover:bg-l-sub disabled:opacity-60 disabled:saturate-[.65]"
              >
                <BarometerFace zone={z.id} />
                <span>
                  <b className="block text-small font-semibold text-l-ink">{z.a}</b>
                  {z.b}
                </span>
              </button>
            ))}
          </div>
          {latest && zoneOf(latest.reflection.barometer) && (
            <div className="mt-3.5 flex items-center gap-2 text-small text-l-ink3">
              <BarometerFace zone={zoneOf(latest.reflection.barometer)!} size={18} />
              Last time: <b className="font-semibold text-l-ink">{latest.reflection.barometer}</b>
            </div>
          )}
          {!open && (
            <div className="mt-4 flex items-center gap-2.5 rounded-[14px] bg-l-sub px-3.5 py-3 text-body text-l-ink2">
              <Lock className="h-4 w-4" strokeWidth={1.5} />
              <span>{`Opens at 16:45 · in ${Math.floor(left / 3600)}h ${Math.ceil((left % 3600) / 60)}m. We'll remind you on Slack.`}</span>
            </div>
          )}
        </>
      )}

      <Dialog open={!!picked} onOpenChange={(o) => !o && setPicked(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Daily reflection</DialogTitle>
          </DialogHeader>
          {picked && (
            <FeedbackForm
              initialData={{ categoryInputs: {}, comfortLevel: picked }}
              onSubmit={async (r: Reflection) => {
                await addReflection({ ...r, _id: undefined, createdAt: new Date().toISOString(), day: today } as HookReflection);
              }}
              onSuccess={() => {
                setPicked(null);
                onSubmitted();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function ReflectionCardSkeleton() {
  return (
    <section className="l-card p-[22px]" aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div>
      <Bone className="h-5 w-36" />
      <Bone className="mt-1.5 h-3.5 w-32" />
        </div>
        <Bone className="h-5 w-16" />
      </div>
      <Bone className="mt-4 h-7 w-52" />
      <div className="mt-3.5 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 px-1 pb-2.5 pt-3">
            <Bone className="h-12 w-12 rounded-full" />
            <Bone className="h-3 w-14" />
          </div>
        ))}
      </div>
    </section>
  );
}
