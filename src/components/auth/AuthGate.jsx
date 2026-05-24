import { useMemo, useState } from "react";
import { supabase, supabaseConfigOk } from "../../lib/supabaseClient";
import { normalizeFullName } from "../../lib/memberCode";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase text-slate-400">{label}</p>
      {children}
    </div>
  );
}

export default function AuthGate({ onSession, initialError = "", onClearInitialError }) {
  const [mode, setMode] = useState("coach"); // coach | member

  const [coachTab, setCoachTab] = useState("login"); // login | signup
  const [coachEmail, setCoachEmail] = useState("");
  const [coachPassword, setCoachPassword] = useState("");
  const [coachAccessCode, setCoachAccessCode] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberCode, setMemberCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function clearMessages() {
    setError("");
    setInfo("");
    onClearInitialError?.();
  }

  const canUseSupabase = supabaseConfigOk && Boolean(supabase);

  const memberHint = useMemo(() => {
    return "Login uses Member Name + Member ID provided by the coach.";
  }, []);

  const expectedCoachAccessCode = import.meta.env.VITE_COACH_ACCESS_CODE;

  function validateCoachAccessCode() {
    if (!expectedCoachAccessCode) {
      setError(
        "Coach Access Code is not set. Add VITE_COACH_ACCESS_CODE in .env.local and restart the dev server.",
      );
      return false;
    }

    if (coachAccessCode.trim() !== String(expectedCoachAccessCode).trim()) {
      setError("Invalid Coach Access Code");
      return false;
    }

    return true;
  }

  async function handleCoachSignup() {
    if (!canUseSupabase) return;
    onClearInitialError?.();
    setError("");
    setInfo("");
    if (!validateCoachAccessCode()) return;
    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: coachEmail.trim(),
        password: coachPassword,
        options: {
          data: { role: "coach" },
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        onSession(data.session);
      } else {
        setInfo("Signup successful. If email confirmation is enabled, verify your email then log in.");
        setCoachTab("login");
      }
    } catch (e) {
      setError(e?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCoachLogin() {
    if (!canUseSupabase) return;
    onClearInitialError?.();
    setError("");
    setInfo("");
    if (!validateCoachAccessCode()) return;
    setBusy(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: coachEmail.trim(),
        password: coachPassword,
      });
      if (loginError) throw loginError;

      await supabase.auth.updateUser({
        data: { role: "coach" },
      });
      onSession(data.session);
    } catch (e) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleMemberLogin() {
    if (!canUseSupabase) return;
    onClearInitialError?.();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const fullName = normalizeFullName(memberName);
      const code = memberCode.trim().toUpperCase();
      if (!fullName || !code) {
        setError("Enter member name and member ID");
        return;
      }

      if (!/^MBR-[A-Z2-9]{8}$/.test(code)) {
        setError("Member ID format is invalid");
        return;
      }

      // Anonymous auth: no email/phone OTP needed.
      const { data, error: anonError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            role: "member",
            member_code: code,
            full_name: fullName,
          },
        },
      });
      if (anonError) throw anonError;

      // Ensure metadata is set (some setups ignore signup data on anon).
      await supabase.auth.updateUser({
        data: {
          role: "member",
          member_code: code,
          full_name: fullName,
        },
      });

      // Ensure token includes latest metadata before App runs its verification query.
      await supabase.auth.refreshSession();

      setInfo("Signed in. Verifying…");
      onSession(data.session);
    } catch (e) {
      const msg = e?.message || "Member login failed";
      if (msg.toLowerCase().includes("anonymous")) {
        setError(
          "Anonymous sign-in is not enabled for this Supabase project. Enable it in Supabase Dashboard → Authentication → Settings (Anonymous sign-ins), then retry.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!supabaseConfigOk) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-xl">
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h1 className="text-2xl font-black">Connect Supabase</h1>
              <p className="mt-2 text-sm text-slate-600">
                Add your Supabase credentials to <span className="font-semibold">.env.local</span>.
              </p>
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700">
                <p className="font-semibold">Required env vars</p>
                <ul className="mt-2 list-disc pl-5">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Tip: copy from <span className="font-semibold">.env.example</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayError = error || initialError;
  const displayInfo = displayError ? "" : info;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Fitness LAB</p>
          <h1 className="mt-2 text-3xl font-black">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Coach uses email/password (with email confirmation). Member uses Member Name + Member ID.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 max-w-sm">
          <button
            onClick={() => {
              clearMessages();
              setMode("member");
            }}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${mode === "member" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Member
          </button>
          <button
            onClick={() => {
              clearMessages();
              setMode("coach");
            }}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${mode === "coach" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Coach
          </button>
        </div>

        {(displayError || displayInfo) && (
          <div
            className={`mb-4 rounded-2xl p-4 text-sm ${displayError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            {displayError || displayInfo}
          </div>
        )}

        {mode === "coach" ? (
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">Coach {coachTab === "login" ? "Login" : "Signup"}</h2>
                <button
                  className="text-sm font-semibold text-slate-600 hover:text-slate-950"
                  onClick={() => {
                    clearMessages();
                    setCoachTab(coachTab === "login" ? "signup" : "login");
                  }}
                >
                  Switch to {coachTab === "login" ? "Signup" : "Login"}
                </button>
              </div>

              <div className="grid gap-3 max-w-md">
                <Field label="Coach Access Code">
                  <Input
                    value={coachAccessCode}
                    onChange={(e) => {
                      clearMessages();
                      setCoachAccessCode(e.target.value);
                    }}
                    placeholder="Enter coach access code"
                    type="password"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    value={coachEmail}
                    onChange={(e) => {
                      clearMessages();
                      setCoachEmail(e.target.value);
                    }}
                    placeholder="coach@yourgym.com"
                    type="email"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Password">
                  <Input
                    value={coachPassword}
                    onChange={(e) => {
                      clearMessages();
                      setCoachPassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    type="password"
                    autoComplete={coachTab === "signup" ? "new-password" : "current-password"}
                  />
                </Field>

                <Button
                  disabled={busy}
                  onClick={coachTab === "login" ? handleCoachLogin : handleCoachSignup}
                  className="rounded-2xl bg-slate-950"
                >
                  {busy ? "Please wait…" : coachTab === "login" ? "Login" : "Create Coach Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-black">Member Login</h2>
              <p className="mt-1 text-sm text-slate-600">{memberHint}</p>

              <div className="mt-4 grid gap-3 max-w-md">
                <Field label="Member Name">
                  <Input
                    value={memberName}
                    onChange={(e) => {
                      clearMessages();
                      setMemberName(e.target.value);
                    }}
                    placeholder="Full name (as added by coach)"
                  />
                </Field>
                <Field label="Member ID">
                  <Input
                    value={memberCode}
                    onChange={(e) => {
                      clearMessages();
                      setMemberCode(e.target.value);
                    }}
                    placeholder="MBR-XXXXXX"
                  />
                </Field>

                <Button disabled={busy} onClick={handleMemberLogin} className="rounded-2xl bg-slate-950">
                  {busy ? "Signing in…" : "Login"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
