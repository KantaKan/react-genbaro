import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Pencil, Plus, X } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import { UserAvatar } from "@/components/user-avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { userService } from "@/application/services/userService";
import { learnerApi } from "../api";
import { usePageHeader } from "../shell/LearnerShell";
import { nicknames } from "../lib/name";
import type { Person } from "../lib/people";
import { Medal } from "../today/Medal";
import { useMyPlant } from "../lib/useMyPlant";
import { AvatarEditor } from "../avatar/AvatarEditor";
import { StylePicker } from "../checkin/StylePicker";
import { styleById } from "../checkin/styles/registry";
import { BarometerStrip } from "./BarometerStrip";
import { usePeople } from "../lib/usePeople";
import { useChampion } from "../cup/useChampion";
import { Bone } from "@/components/LoadingSkeleton";

const MAX_SKILLS = 5;

export function MyProfilePage() {
  const qc = useQueryClient();
  const { userData, refetchUserData } = useUserData();
  const me = userData as Person | null;
  const summary = useQuery(["my-summary"], learnerApi.getSummary);
  const reflections = useQuery(["my-reflections", me?._id], () => learnerApi.getMyReflections(me!._id), { enabled: !!me?._id });
  const { byId } = usePeople();
  const { isChampion, medals } = useChampion();
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<"avatar" | "profile" | "style" | null>(null);
  usePageHeader({ title: "My profile", context: "Classmates see your bio, skills, avatar and badges" });
  const n = useMemo(() => nicknames(me?.zoom_name, me?.first_name ?? ""), [me]);
  const plant = useMyPlant();
  if (!me) return null;
  const champ = isChampion(me.genmate_group);
  const mySkills = skills ?? me.skills ?? [];
  const s = summary.data;

  const saveSkills = async (next: string[]) => {
    setSkills(next);
    try {
      await learnerApi.savePreferences({ skills: next });
      refetchUserData?.();
    } catch (e) {
      setSkills(null);
      toast.error(e instanceof Error ? e.message : "Couldn't save skills");
    }
  };
  const canAdd = skill.trim().length > 0 && skill.trim().length <= 24 && mySkills.length < MAX_SKILLS;
  const style = styleById(s?.preferences?.checkin_random ? "slide" : s?.preferences?.checkin_style || "slide");

  return (
    <div className="flex flex-col gap-4">
      <section className="l-card overflow-hidden p-[22px]">
        <div className={`-m-[22px] mb-0 h-[150px] bg-l-sub dark:opacity-60 ${champ ? "bg-[radial-gradient(60%_120%_at_15%_20%,#fde68a,transparent_60%),radial-gradient(50%_120%_at_85%_10%,#fbbf24,transparent_60%),radial-gradient(60%_120%_at_60%_100%,#fef3c7,transparent_60%)]" : "bg-[radial-gradient(60%_120%_at_15%_20%,#c7d2fe,transparent_60%),radial-gradient(50%_120%_at_85%_10%,#fbcfe8,transparent_60%),radial-gradient(60%_120%_at_60%_100%,#bbf7d0,transparent_60%)]"}`} />
        <div className="relative z-[1] -mt-[46px] flex flex-wrap items-end gap-4">
          <button type="button" aria-label="Customize avatar" onClick={() => setEditing("avatar")} className="relative rounded-full shadow-[0_0_0_5px_var(--l-card),0_12px_24px_-12px_rgba(0,0,0,.3)]">
            <UserAvatar userId={me._id} name={n.en} avatar={me.avatar} champion={champ} className="h-[104px] w-[104px]" />
            <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-l-ink text-l-card shadow-[0_0_0_3px_var(--l-card)]">
              <Pencil className="h-3.5 w-3.5" />
            </span>
          </button>
          <div className="min-w-[220px] flex-1 pb-1">
            <h2 className="text-[26px] font-semibold tracking-tight">{n.th ? `${n.th} · ${n.en}` : n.en}</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-l-ink2">
              <span>{me.first_name} {me.last_name?.slice(0, 1)}.</span>
              <span className="text-l-ink3">·</span>
              <span>#{me.jsd_number ?? "–"}</span>
              {me.genmate_group && <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">GenMate {me.genmate_group}</span>}
              {me.project_group && <span className="rounded-full bg-l-sub px-2.5 py-0.5 text-xs font-semibold text-l-ink2">Project: {me.project_group}</span>}
            </div>
          </div>
          <button type="button" onClick={() => setEditing("profile")} className="mb-1 rounded-full bg-l-card px-4 py-2 text-body font-medium shadow-[0_0_0_1px_var(--l-hair)]">
            Edit profile
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Plant streak", plant.ready ? (plant.nights > 0 ? `${plant.nights} ${plant.nights === 1 ? "night" : "nights"}` : "Resting") : "–", plant.nights ? "text-l-green" : "", !plant.ready],
            ["Attendance", s ? `${(s.attendance_rate * 100).toFixed(1)}%` : "–", "", summary.isLoading],
            ["Reflections", `${reflections.data?.length ?? 0}`, "", reflections.isLoading],
            ["Badges", `${me.badges?.length ?? 0}`, "", false],
          ].map(([k, v, c, loading]) => (
            <div key={String(k)} className="rounded-2xl bg-l-sub px-4 py-3.5 shadow-[0_0_0_1px_var(--l-hair)]">
              <small className="block text-xs text-l-ink3">{k}</small>
              {loading ? <Bone className="mt-1 h-7 w-16 bg-l-card" /> : <b className={`text-2xl font-semibold tabular-nums tracking-tight ${c}`}>{v}</b>}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <section className="l-card p-[22px]">
            <h3 className="text-title font-semibold">About me</h3>
            <p className="mt-2.5 leading-relaxed text-l-ink2">{me.bio || "Tell classmates a little about yourself. Tap Edit profile."}</p>
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              {mySkills.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-l-sub px-2 py-0.5 text-small font-medium text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
                  {k}
                  <button type="button" aria-label={`Remove ${k}`} onClick={() => saveSkills(mySkills.filter((x) => x !== k))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-lg px-1.5 shadow-[0_0_0_1px_var(--l-hair)]">
                <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Add a skill" maxLength={24} className="w-24 bg-transparent py-0.5 text-small outline-none" />
                <button type="button" aria-label="Add skill" disabled={!canAdd} onClick={() => (saveSkills([...mySkills, skill.trim()]), setSkill(""))} className="disabled:opacity-40">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </span>
              {mySkills.length >= MAX_SKILLS && <span className="text-small text-l-ink3">Up to {MAX_SKILLS} skills</span>}
            </div>
          </section>
          {reflections.isLoading ? (
            <section aria-hidden className="l-card p-[22px]">
              <Bone className="h-5 w-48" />
              <Bone className="mt-1.5 h-3.5 w-72 max-w-full" />
              <Bone className="mt-4 h-16 w-full" />
            </section>
          ) : (
            <BarometerStrip reflections={reflections.data ?? []} />
          )}
          <section className="l-card p-[22px]">
            <h3 className="text-title font-semibold">Recommendations</h3>
            <p className="mt-0.5 text-small text-l-ink3">What classmates and TAs say about working with you</p>
            {(me.profile_comments ?? []).filter((c) => !c.parentId).length === 0 && <p className="mt-3 text-body text-l-ink3">No recommendations yet.</p>}
            {(me.profile_comments ?? [])
              .filter((c) => !c.parentId)
              .slice(0, 5)
              .map((c) => (
                <div key={c.id ?? c._id} className="flex gap-3 border-t border-l-hair py-3.5 first:mt-2 first:border-t-0">
                  <UserAvatar userId={c.userId} name={c.zoomName} avatar={byId.get(c.userId)?.avatar} className="h-[34px] w-[34px]" />
                  <div>
                    <q className="block leading-relaxed">{c.content}</q>
                    <small className="text-xs text-l-ink3">{nicknames(c.zoomName, c.zoomName).th || nicknames(c.zoomName, c.zoomName).en}</small>
                  </div>
                </div>
              ))}
          </section>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <section className="l-card p-[22px]">
            <h3 className="text-title font-semibold">Badges</h3>
            <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3.5">
              {(me.badges ?? []).map((b) => (
                <Medal key={b._id ?? b.name} name={b.name} color={b.color || "#6366f1"} glyph={b.name.slice(0, 1).toUpperCase()} />
              ))}
              {medals.map((m) => (
                <Medal key={m.week} name={`GenMate Cup · Week ${m.week_no}`} sub={medals.length >= 3 ? "Gold" : "Cup"} color={medals.length >= 3 ? "#f59e0b" : "#a1a1aa"} glyph={String(m.week_no)} />
              ))}
              {!s?.perfect_week && <Medal name="Perfect week" sub="Not yet" locked progress={0} />}
            </div>
          </section>
          <section className="l-card p-[22px]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-title font-semibold">Check-in style</h3>
                <p className="mt-0.5 text-small text-l-ink3">{s?.preferences?.checkin_random ? "Surprise me every day" : style?.name}</p>
              </div>
              <button type="button" onClick={() => setEditing("style")} className="-m-2 rounded-lg p-2 text-body font-medium text-l-ink2 hover:bg-l-sub">
                Change ›
              </button>
            </div>
          </section>
          <section className="l-card p-[22px]">
            <h3 className="text-title font-semibold">Details</h3>
            {[
              ["Cohort", `JSD${me.cohort_number}`],
              ["Learner no.", `#${me.jsd_number ?? "–"}`],
              ["Zoom name", me.zoom_name ?? "–"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-t border-l-hair py-2.5 text-body text-l-ink2 first:mt-2 first:border-t-0">
                <span>{k}</span>
                <b className="font-semibold text-l-ink">{v}</b>
              </div>
            ))}
            <Link to="/learner/garden" className="mt-2 inline-block text-body font-medium text-l-ink2 underline">
              My Genmate Garden plant ›
            </Link>
          </section>
        </div>
      </div>

      {editing === "avatar" && (
        <AvatarEditor open onOpenChange={(o) => !o && setEditing(null)} current={me.avatar} seed={me._id} name={n.en} streak={s?.streak ?? 0} onSaved={() => refetchUserData?.()} />
      )}
      {editing === "style" && s && <StylePicker open onOpenChange={(o) => !o && setEditing(null)} summary={s} />}
      {editing === "profile" && <EditProfile me={me} onClose={() => setEditing(null)} onSaved={() => (refetchUserData?.(), qc.invalidateQueries(["cohort-people"]))} />}
    </div>
  );
}

function EditProfile({ me, onClose, onSaved }: { me: Person; onClose: () => void; onSaved: () => void }) {
  const [bio, setBio] = useState(me.bio ?? "");
  const [links, setLinks] = useState({ github: me.social_links?.github ?? "", linkedin: me.social_links?.linkedin ?? "", instagram: me.social_links?.instagram ?? "" });
  const save = async () => {
    try {
      await userService.updateUserPersonalDetails(me._id, { bio, social_links: links });
      toast.success("Profile saved");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="learner rounded-[22px] border-0 bg-l-card text-l-ink">
        <DialogTitle>Edit profile</DialogTitle>
        <label className="text-small font-semibold text-l-ink2">
          About me
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} className="mt-2 h-24 w-full resize-none rounded-xl bg-l-card px-3 py-2.5 font-normal text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
        </label>
        {(["github", "linkedin", "instagram"] as const).map((k) => (
          <label key={k} className="text-small font-semibold capitalize text-l-ink2">
            {k} URL
            <input value={links[k]} onChange={(e) => setLinks((l) => ({ ...l, [k]: e.target.value }))} className="mt-1.5 w-full rounded-xl bg-l-card px-3 py-2 font-normal text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-body font-medium shadow-[0_0_0_1px_var(--l-hair)]">
            Cancel
          </button>
          <button type="button" onClick={save} className="rounded-full bg-l-ink px-4 py-2 text-body font-medium text-l-card">
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
