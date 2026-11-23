import { useRef, useState } from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ROLE_LABEL } from "./perm";
import { inviteApi } from "./api";

const field = "w-full rounded-xl bg-l-sub px-3 py-2.5 text-title text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]";

/** Public page an invite link opens: create a staff account, or upgrade an existing one. */
export function InvitePage() {
  const { token = "" } = useParams();
  const nav = useNavigate();
  const q = useQuery(["invite", token], () => inviteApi.get(token), { retry: false });
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const inv = q.data;
  const ok = inv?.existing ? pw.length > 0 : first.trim() !== "" && pw.length >= 8 && pw === pw2;
  const submit = async () => {
    if (lock.current || !ok || !inv) return;
    lock.current = true;
    setBusy(true);
    try {
      await inviteApi.accept(token, inv.existing ? { password: pw } : { first_name: first.trim(), last_name: last.trim(), password: pw });
      toast.success("You're on the team. Log in to start.");
      nav("/login", { replace: true });
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Couldn't accept the invite");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const label = (t: string, input: JSX.Element) => (
    <label className="block text-xs font-semibold text-l-ink2">
      {t}
      <div className="mt-1.5">{input}</div>
    </label>
  );
  return (
    <div className="learner grid min-h-screen place-items-center bg-l-bg px-4 text-l-ink">
      <main className="w-full max-w-[420px] rounded-[24px] bg-l-card p-6 shadow-[0_0_0_1px_var(--l-hair),0_18px_40px_-24px_rgba(24,24,27,.3)]">
        <div className="mb-4 grid h-9 w-9 place-items-center rounded-[11px] bg-l-ink text-sm font-bold text-l-card">B</div>
        {q.isLoading && <div className="h-40 animate-pulse rounded-xl bg-l-sub" />}
        {q.isError && (
          <>
            <h1 className="text-lg font-semibold">This link doesn't work</h1>
            <p className="mt-1.5 text-body text-l-ink2">It has expired or was already used. Ask whoever invited you for a new one.</p>
          </>
        )}
        {inv && (
          <>
            <h1 className="text-lg font-semibold">You're invited to Baro</h1>
            <p className="mt-1 text-body text-l-ink2">
              as {ROLE_LABEL[inv.role]}
              {inv.cohorts.length > 0 && ` · ${inv.cohorts.map((c) => `JSD${c}`).join(", ")}`}
            </p>
            <p className="mt-0.5 text-xs text-l-ink3">{inv.email}</p>
            <form
              className="mt-5 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {inv.existing ? (
                <>
                  <p className="text-body text-l-ink2">You already have a Baro account. Sign in with it to accept.</p>
                  {label("Your current password", <input aria-label="Your current password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={field} />)}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {label("First name", <input aria-label="First name" autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} className={field} />)}
                    {label("Last name", <input aria-label="Last name" autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} className={field} />)}
                  </div>
                  {label("Password", <input aria-label="Password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={field} />)}
                  {label("Confirm password", <input aria-label="Confirm password" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={field} />)}
                  <p className={`text-xs ${pw2 && pw !== pw2 ? "font-semibold text-red-600" : "text-l-ink3"}`}>{pw2 && pw !== pw2 ? "Passwords don't match." : "At least 8 characters."}</p>
                </>
              )}
              <button type="submit" disabled={!ok || busy} className="mt-1 rounded-full bg-l-ink py-2.5 text-title font-semibold text-l-card disabled:opacity-40">
                {inv.existing ? "Accept invite" : "Join Baro"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
