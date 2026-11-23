import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { wellbeingApi } from "../wellbeing";

export function NotesTab({ learnerId }: { learnerId: string }) {
  const qc = useQueryClient();
  const notes = useQuery(["admin-notes", learnerId], () => wellbeingApi.notes(learnerId));
  const [text, setText] = useState("");
  const busy = useRef(false);
  const add = async () => {
    if (busy.current || !text.trim()) return;
    busy.current = true;
    try {
      await wellbeingApi.addNote(learnerId, text.trim());
      setText("");
      qc.invalidateQueries(["admin-notes", learnerId]);
      qc.invalidateQueries(["admin-overview", learnerId]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      busy.current = false;
    }
  };
  return (
    <div>
      <textarea aria-label="New note" value={text} onChange={(e) => setText(e.target.value)} placeholder="Private note (only admins see this)…" className="h-[70px] w-full resize-none rounded-xl bg-l-sub px-3 py-2.5 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
      <button type="button" disabled={!text.trim()} onClick={add} className="mt-2 rounded-full bg-l-ink px-4 py-1.5 text-small font-semibold text-l-card disabled:opacity-40">
        Add note
      </button>
      <div className="mt-3">
        {(notes.data ?? []).map((n) => (
          <div key={n.id} className="border-b border-l-hair py-2.5 text-body leading-relaxed last:border-0">
            <small className="block text-small text-l-ink3">
              {n.author_name} · {new Date(n.created_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" })}
            </small>
            <span className="whitespace-pre-wrap">{n.text}</span>
          </div>
        ))}
        {notes.data && notes.data.length === 0 && <p className="text-small text-l-ink3">No notes yet.</p>}
      </div>
    </div>
  );
}
