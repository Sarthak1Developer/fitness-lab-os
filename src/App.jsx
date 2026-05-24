import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Droplets,
  FileSpreadsheet,
  Home,
  Lock,
  Plus,
  Save,
  Search,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import AuthGate from "./components/auth/AuthGate";
import { supabase } from "./lib/supabaseClient";
import { generateMemberCode, normalizeFullName, normalizePhoneE164 } from "./lib/memberCode";

const exerciseCategories = {
  "Lower Body — Squat Pattern": [
    "Back Squat",
    "Front Squat",
    "Goblet Squat",
    "Zercher Squat",
    "Safety Bar Squat",
    "Box Squat",
    "Overhead Squat",
    "Bulgarian Split Squat",
    "Split Squat",
    "Walking Lunge",
    "Reverse Lunge",
    "Step Up",
    "Leg Press",
    "Hack Squat",
    "Belt Squat",
    "Single Leg Squat",
    "Pistol Squat",
    "Spanish Squat",
    "Wall Sit",
  ],

  "Lower Body — Hip Hinge": [
    "Conventional Deadlift",
    "Trap Bar Deadlift",
    "Sumo Deadlift",
    "Romanian Deadlift",
    "Stiff Leg Deadlift",
    "Single Leg RDL",
    "Hip Thrust",
    "Barbell Glute Bridge",
    "Cable Pull Through",
    "Good Morning",
    "Nordic Hamstring Curl",
    "Back Extension",
    "45 Degree Hyperextension",
    "Kettlebell Swing",
  ],

  "Upper Body — Horizontal Push": [
    "Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Dumbbell Bench Press",
    "Push Up",
    "Weighted Push Up",
    "Machine Chest Press",
    "Cable Chest Press",
    "Floor Press",
    "Landmine Press",
  ],

  "Upper Body — Vertical Push": [
    "Overhead Press",
    "Push Press",
    "Arnold Press",
    "Dumbbell Shoulder Press",
    "Behind Neck Press",
    "Handstand Push Up",
    "Single Arm Landmine Press",
  ],

  "Upper Body — Horizontal Pull": [
    "Chest Supported Row",
    "Bent Over Row",
    "Pendlay Row",
    "Seated Cable Row",
    "Single Arm DB Row",
    "Inverted Row",
    "Machine Row",
    "T Bar Row",
  ],

  "Upper Body — Vertical Pull": [
    "Pull Up",
    "Chin Up",
    "Lat Pulldown",
    "Neutral Grip Pull Up",
    "Assisted Pull Up",
    "Straight Arm Pulldown",
    "Rope Pullover",
  ],

  "Shoulder / Scapular": [
    "Face Pull",
    "YTWL",
    "Band Pull Apart",
    "Scaption Raise",
    "Lateral Raise",
    "Front Raise",
    "External Rotation",
    "Internal Rotation",
    "Serratus Punch",
    "Wall Slide",
  ],

  Arms: [
    "Barbell Curl",
    "Hammer Curl",
    "Incline Curl",
    "Preacher Curl",
    "Cable Curl",
    "Tricep Pushdown",
    "Overhead Tricep Extension",
    "Skull Crusher",
    "Close Grip Bench Press",
  ],

  "Core / Trunk": [
    "Pallof Press",
    "Dead Bug",
    "Bird Dog",
    "Side Plank",
    "Front Plank",
    "Hollow Hold",
    "Suitcase Carry",
    "Farmer Carry",
    "Turkish Get Up",
    "Ab Wheel Rollout",
    "Cable Chop",
    "McGill Curl Up",
    "Sorensen Hold",
  ],

  "Power / Olympic Lift": [
    "Power Clean",
    "Hang Clean",
    "Clean Pull",
    "Power Snatch",
    "Hang Snatch",
    "Push Jerk",
    "Split Jerk",
    "High Pull",
    "Medicine Ball Slam",
    "Rotational Med Ball Throw",
  ],

  Plyometric: [
    "CMJ",
    "Squat Jump",
    "Broad Jump",
    "Depth Jump",
    "Drop Jump",
    "Box Jump",
    "Lateral Bound",
    "Single Leg Hop",
    "Pogo Jump",
    "Skater Jump",
    "Hurdle Hop",
    "Triple Broad Jump",
  ],

  "Speed / Agility": [
    "Acceleration Sprint",
    "10m Sprint",
    "20m Sprint",
    "Fly Sprint",
    "Shuttle Run",
    "5-10-5",
    "T Test",
    "Carioca",
    "A Skip",
    "B Skip",
    "Wall Drill",
    "Resisted Sprint",
  ],

  "Conditioning / Hybrid": [
    "Assault Bike",
    "Echo Bike",
    "SkiErg",
    "RowErg",
    "Sled Push",
    "Sled Pull",
    "Burpee Broad Jump",
    "Wall Ball",
    "Farmer Carry",
    "Sandbag Carry",
    "Battle Rope",
    "Shuttle Run",
    "Box Step Over",
  ],

  "Mobility / Recovery": [
    "90/90 Hip Flow",
    "World Greatest Stretch",
    "Cat Camel",
    "Couch Stretch",
    "Ankle Mobility Drill",
    "Thoracic Rotation",
    "Hip Airplane",
    "Foam Rolling",
    "Breathing Drill",
    "Band Mobility",
  ],
};

const normativeBands = [
  {
    test: "CMJ",
    score: "42 cm",
    rating: "Good",
    note: "Competitive field sport range",
  },
  {
    test: "Broad Jump",
    score: "220 cm",
    rating: "Above Average",
    note: "Power output improving",
  },
  {
    test: "10m Sprint",
    score: "1.92 sec",
    rating: "Good",
    note: "Acceleration profile",
  },
  {
    test: "Grip Strength",
    score: "48 kg",
    rating: "Above Average",
    note: "Compared with age/sex norms",
  },
  {
    test: "VO₂ Max",
    score: "43 ml/kg/min",
    rating: "Good",
    note: "Cardiorespiratory fitness",
  },
  {
    test: "FMS",
    score: "16 / 21",
    rating: "Moderate",
    note: "Movement competency",
  },
];

const goalOptions = [
  "Fat Loss",
  "Muscle Gain / Hypertrophy",
  "Strength",
  "Return to Play / Sports",
  "Rehab / Physio",
  "Athletic Performance",
  "Special Population",
];

function calculateAgeFromDOB(dob) {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  )
    age -= 1;
  return age >= 0 ? age : "";
}

function getCardioCategoryFromVO2(vo2) {
  const value = Number(vo2 || 0);
  if (!value) return "not_tested";
  if (value < 30) return "low_cardio";
  if (value < 45) return "moderate_cardio";
  return "high_cardio";
}

function classifyMember({
  fmsTotal,
  pain,
  vo2Estimate,
  movementQuality,
  trainingHistory,
}) {
  const fmsNum = Number(fmsTotal || 0);
  const painNum = Number(pain || 0);
  const cardioCategory = getCardioCategoryFromVO2(vo2Estimate);

  const baseFlags = [
    fmsNum <= 14,
    painNum >= 4,
    cardioCategory === "low_cardio",
    movementQuality === "poor",
  ].filter(Boolean).length;

  const performanceFlags = [
    fmsNum >= 17,
    painNum <= 1,
    cardioCategory === "high_cardio",
    movementQuality === "advanced",
    trainingHistory === "structured_training",
  ].filter(Boolean).length;

  if (baseFlags >= 2) return "BASE";
  if (performanceFlags >= 4) return "PERFORMANCE";
  return "FITNESS";
}

function getSleepSubscore(hours, quality) {
  const h = Number(hours || 0);
  const q = Number(quality || 0);
  const durationScore = h >= 8 ? 10 : h >= 7 ? 8 : h >= 6 ? 6 : h >= 5 ? 4 : 2;
  const qualityScore = Math.min(10, Math.max(0, q));
  return Math.round((durationScore * 0.55 + qualityScore * 0.45) * 10);
}

function getMoodSubscore(mood, motivation) {
  const m = Math.min(10, Math.max(0, Number(mood || 0)));
  const mo = Math.min(10, Math.max(0, Number(motivation || mood || 0)));
  return Math.round(((m + mo) / 2) * 10);
}

function getSorenessFatigueSubscore(soreness, fatigue) {
  const s = Math.min(10, Math.max(0, Number(soreness || 0)));
  const f = Math.min(10, Math.max(0, Number(fatigue || 0)));
  const penalty = (s * 0.5 + f * 0.5) * 10;
  return Math.round(Math.max(0, 100 - penalty));
}

function getHydrationSubscore(hydration, urineColor, thirst) {
  let score = 100;
  if (hydration === "moderate") score -= 20;
  if (hydration === "low") score -= 40;
  if (urineColor === "yellow") score -= 10;
  if (urineColor === "dark") score -= 25;
  if (thirst === "mild") score -= 10;
  if (thirst === "high") score -= 25;
  return Math.max(0, Math.min(100, score));
}

function readinessScore({
  sleepHours,
  sleepQuality,
  mood,
  motivation,
  soreness,
  fatigue,
  hydration,
  urineColor,
  thirst,
}) {
  const sleep = getSleepSubscore(sleepHours, sleepQuality);
  const moodScore = getMoodSubscore(mood, motivation);
  const sorenessFatigue = getSorenessFatigueSubscore(soreness, fatigue);
  const hydrationScore = getHydrationSubscore(hydration, urineColor, thirst);

  return Math.round(
    sleep * 0.3 + moodScore * 0.25 + sorenessFatigue * 0.25 + hydrationScore * 0.2,
  );
}

function readinessInterpretation(score) {
  if (score >= 85)
    return {
      label: "High Readiness",
      advice:
        "Proceed with planned training. High-intensity work is acceptable if technique is good.",
      tone: "performance",
    };
  if (score >= 70)
    return {
      label: "Moderate Readiness",
      advice:
        "Train as planned, but monitor warm-up quality and reduce volume if fatigue rises.",
      tone: "fitness",
    };
  if (score >= 55)
    return {
      label: "Low-Moderate Readiness",
      advice:
        "Reduce intensity or volume. Prioritise technique, mobility, Zone 2 or recovery work.",
      tone: "base",
    };
  return {
    label: "Low Readiness",
    advice:
      "Recovery-biased day recommended. Avoid high CNS load, max strength, sprints or intense conditioning.",
    tone: "danger",
  };
}

function Badge({ children, tone = "default" }) {
  const styles = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    unclassified: "bg-slate-100 text-slate-700 border-slate-200",
    base: "bg-amber-50 text-amber-700 border-amber-200",
    fitness: "bg-blue-50 text-blue-700 border-blue-200",
    performance: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    dark: "bg-slate-900 text-white border-slate-900",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-slate-900 p-2 text-white">
            <Icon size={18} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900"
    >
      {children}
    </select>
  );
}

function SaveButton({ children = "Save", className = "" }) {
  const [saved, setSaved] = useState(false);
  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }
  return (
    <Button onClick={handleSave} className={`rounded-2xl bg-slate-950 ${className}`}>
      {saved ? (
        <CheckCircle2 size={16} className="mr-2" />
      ) : (
        <Save size={16} className="mr-2" />
      )}
      {saved ? "Saved" : children}
    </Button>
  );
}

export default function FitnessLabOS() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(() => Boolean(supabase));
  const [dbError, setDbError] = useState("");
  const [authGateError, setAuthGateError] = useState("");
  const [memberVerified, setMemberVerified] = useState(false);
  const [memberVerifying, setMemberVerifying] = useState(false);
  const [tab, setTab] = useState("home");
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [search, setSearch] = useState("");

  const role = session?.user?.email ? "coach" : "member";

  const emptyMember = useMemo(
    () => ({
      id: "",
      name: "No members yet",
      age: "",
      gender: "",
      goal: "",
      readinessTrend: "",
      phase: "UNCLASSIFIED",
      status: "",
      renewal: "",
      fms: "Not assessed",
      pain: "Not assessed",
      cardio: "Not assessed",
      trainingAge: "Not assessed",
      vo2Estimate: "Not assessed",
      movementQuality: "Not assessed",
      trainingHistory: "Not assessed",
    }),
    [],
  );

  function mapMemberRow(row) {
    return {
      id: row.id,
      memberCode: row.member_code,
      phone: row.phone,
      name: row.full_name,
      gender: row.gender || "male",
      dob: row.dob || "",
      age: row.age ?? "",
      goal: row.goal || "Fat Loss",
      readinessTrend: row.readiness_trend || "stable",
      phase: row.phase || "UNCLASSIFIED",
      status: row.status || "Active",
      renewal: row.renewal || "",
      fms: "Not assessed",
      pain: "Not assessed",
      cardio: "Not assessed",
      cardioCapacity: "Not assessed",
      vo2Estimate: "Not assessed",
      movementQuality: "Not assessed",
      trainingHistory: "Not assessed",
      trainingAge: "Not assessed",
    };
  }

  function formatDbSetupError(err) {
    const msg = err?.message || String(err || "");
    if (msg.includes("Could not find the table 'public.members'")) {
      return "Supabase DB not initialized: run supabase/schema.sql in Supabase SQL Editor, then go to Settings → API → Reload schema cache.";
    }
    return msg || "Database error";
  }

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setSession(data.session);
        setSessionLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSessionLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    if (!session) {
      queueMicrotask(() => {
        setMemberVerified(false);
        setMemberVerifying(false);
      });
      return;
    }

    if (role === "coach") {
      queueMicrotask(() => {
        setMemberVerified(true);
        setMemberVerifying(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      setMemberVerified(false);
      setMemberVerifying(true);
    });

    async function verifyMember() {
      try {
        await supabase.auth.refreshSession();
        const current = (await supabase.auth.getSession()).data.session;
        const code = current?.user?.user_metadata?.member_code;
        const fullName = current?.user?.user_metadata?.full_name;

        if (!code || !fullName) {
          throw new Error("Missing member credentials. Please login again.");
        }

        const normalizedCode = String(code).trim().toUpperCase();
        const normalizedName = normalizeFullName(fullName);

        const { data, error } = await supabase
          .from("members")
          .select("id, full_name")
          .eq("member_code", normalizedCode)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Invalid member name or member id");

        // Extra guard (in case RLS policy is relaxed): require name match after normalization.
        if (normalizeFullName(data.full_name).toLowerCase() !== normalizedName.toLowerCase()) {
          throw new Error("Invalid member name or member id");
        }

        if (cancelled) return;
        setMemberVerified(true);
        setMemberVerifying(false);
      } catch (e) {
        if (cancelled) return;
        setMemberVerified(false);
        setMemberVerifying(false);
        setAuthGateError(formatDbSetupError(e));
        await supabase.auth.signOut();
      }
    }

    verifyMember();

    return () => {
      cancelled = true;
    };
  }, [role, session?.user?.id]);

  useEffect(() => {
    if (!supabase || !session?.user?.id) return;
    if (role === "member" && !memberVerified) return;

    let cancelled = false;

    async function loadMembers() {
      setDbError("");
      if (role === "coach") {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) {
          console.error(error);
          setDbError(formatDbSetupError(error));
          return;
        }
        const mapped = (data || []).map(mapMemberRow);
        setMembers(mapped);
        setSelectedMemberId((prev) => prev || (mapped[0] ? String(mapped[0].id) : ""));
      } else {
        const memberCode = session?.user?.user_metadata?.member_code;
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("member_code", memberCode || "")
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error(error);
          setDbError(formatDbSetupError(error));
          return;
        }
        const mapped = data ? [mapMemberRow(data)] : [];
        setMembers(mapped);
        setSelectedMemberId(mapped[0] ? String(mapped[0].id) : "");
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [memberVerified, role, session?.user?.id]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-xl">
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-slate-600">Loading session…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthGate
        onSession={setSession}
        initialError={authGateError}
        onClearInitialError={() => setAuthGateError("")}
      />
    );
  }

  if (role === "member" && (memberVerifying || !memberVerified)) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-xl">
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-slate-600">Verifying member…</p>
              <p className="mt-2 text-xs text-slate-500">
                If this takes more than a few seconds, your member name / member ID may be incorrect.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedMember =
    members.find((m) => String(m.id) === String(selectedMemberId)) ||
    members[0] ||
    emptyMember;

  const filteredMembers = members.filter((m) =>
    String(m.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalMembers = members.length;
  const baseCount = members.filter((m) => m.phase === "BASE").length;
  const fitnessCount = members.filter((m) => m.phase === "FITNESS").length;
  const performanceCount = members.filter((m) => m.phase === "PERFORMANCE").length;

  const nav =
    role === "member"
      ? [
          ["home", Home, "Home"],
          ["profile", Users, "Profile"],
          ["train", Dumbbell, "Train"],
          ["recovery", Droplets, "Recovery"],
          ["assessments", ClipboardList, "Assessments"],
          ["progress", TrendingUp, "Progress"],
        ]
      : [
          ["home", Home, "Dashboard"],
          ["members", Users, "Members"],
          ["programming", FileSpreadsheet, "Programming"],
          ["assessments", ClipboardList, "Assessments"],
          ["reports", BarChart3, "Reports"],
          ["admin", Lock, "Admin / Billing"],
        ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="mx-auto flex max-w-7xl gap-5 p-4 md:p-6">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <div className="mb-6 rounded-3xl bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Fitness LAB
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              Human Performance OS
            </h1>
            <p className="mt-3 text-xs text-slate-300">
              Assessment • Readiness • Programming • Tracking • Business
            </p>
          </div>

          <div className="mb-4 rounded-2xl bg-slate-100 p-4">
            <p className="text-xs font-bold uppercase text-slate-400">Signed in</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {role === "coach"
                ? session?.user?.email || "Coach"
                : session?.user?.phone || "Member"}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500 capitalize">
              Role: {role}
            </p>
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                setTab("home");
              }}
              className="mt-3 w-full bg-slate-200 text-slate-900 hover:bg-slate-300"
            >
              Logout
            </Button>
          </div>

          <nav className="space-y-1">
            {nav.map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${tab === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-100 p-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Signed in</p>
                <p className="mt-0.5 text-sm font-black text-slate-950">
                  {role === "coach"
                    ? session?.user?.email || "Coach"
                    : session?.user?.phone || "Member"}
                </p>
                <p className="text-xs font-semibold text-slate-500 capitalize">Role: {role}</p>
              </div>
              <Button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setTab("home");
                }}
                className="bg-slate-200 text-slate-900 hover:bg-slate-300"
              >
                Logout
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {nav.map(([id, Icon, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition ${tab === id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            {dbError && (
              <div className="mb-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {dbError}
              </div>
            )}
            <div className="mb-3 hidden gap-2 overflow-x-auto pb-1 lg:flex">
              {nav.map(([id, Icon, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition ${tab === id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  AI-Assisted Human Performance Operating System
                </p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">
                  Fitness LAB OS
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    selectedMember.phase === "UNCLASSIFIED"
                      ? "unclassified"
                      : selectedMember.phase.toLowerCase()
                  }
                >
                  {selectedMember.phase}
                </Badge>
                <Select
                  value={selectedMemberId}
                  onChange={(v) => setSelectedMemberId(v)}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "home" && (
              <HomeDashboard
                role={role}
                selectedMember={selectedMember}
                totalMembers={totalMembers}
                baseCount={baseCount}
                fitnessCount={fitnessCount}
                performanceCount={performanceCount}
              />
            )}
            {tab === "members" && (
              <Members
                members={filteredMembers}
                setMembers={setMembers}
                search={search}
                setSearch={setSearch}
                setSelectedMemberId={setSelectedMemberId}
                session={session}
              />
            )}
            {tab === "profile" && <MemberProfile selectedMember={selectedMember} />}
            {tab === "recovery" && <Recovery selectedMember={selectedMember} />}
            {tab === "assessments" &&
              (role === "member" ? (
                <MemberAssessments selectedMember={selectedMember} />
              ) : (
                <Assessments selectedMember={selectedMember} />
              ))}
            {tab === "programming" && <Programming selectedMember={selectedMember} />}
            {tab === "train" && <Training selectedMember={selectedMember} />}
            {tab === "progress" && <Progress selectedMember={selectedMember} />}
            {tab === "reports" && <Reports members={members} />}
            {tab === "admin" && <Admin members={members} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function HomeDashboard({
  role,
  selectedMember,
  totalMembers,
  baseCount,
  fitnessCount,
  performanceCount,
}) {
  const sampleReadiness = readinessScore({
    sleepHours: 7,
    sleepQuality: 7,
    mood: 7,
    motivation: 7,
    soreness: 2,
    fatigue: 3,
    hydration: "good",
    urineColor: "pale",
    thirst: "none",
  });

  if (role === "member") {
    return (
      <div>
        <SectionTitle
          icon={Home}
          title="Home"
          subtitle="Your daily performance dashboard: readiness, hydration, recovery and current training category."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Readiness"
            value={`${sampleReadiness}/100`}
            icon={Droplets}
          />
          <MetricCard
            label="Current Category"
            value={selectedMember.phase}
            icon={ShieldCheck}
          />
          <MetricCard label="Goal" value={selectedMember.goal} icon={TrendingUp} />
        </div>

        <Card className="mt-5 rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Your current category
                </p>
                <h3 className="mt-2 text-3xl font-black">
                  You are currently in {selectedMember.phase} phase
                </h3>
                <p className="mt-3 max-w-2xl text-sm text-slate-500">
                  This category is based on your assessment profile: movement quality, FMS score, VO₂/cardiorespiratory fitness, pain levels and training history.
                </p>
              </div>
              <Badge
                tone={
                  selectedMember.phase === "UNCLASSIFIED"
                    ? "unclassified"
                    : selectedMember.phase.toLowerCase()
                }
              >
                {selectedMember.phase}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Recovery / Readiness
                  </p>
                  <h3 className="mt-2 text-2xl font-black">
                    Today’s readiness: {sampleReadiness}/100
                  </h3>
                </div>
                <Badge tone="performance">Ready</Badge>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Mini label="Sleep" value="7 / 10" />
                <Mini label="Mood + Motivation" value="7 / 10" />
                <Mini label="Soreness / Pain" value="2 / 10" />
                <Mini label="Hydration" value="Good" />
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                <b>Recovery inputs:</b> sleep quality, mood + motivation, soreness/pain, hydration status and tiredness are combined to estimate your daily readiness.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-black">Hydration Protocol</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <b>Before training:</b> ~500 ml fluid before session.
                </p>
                <p>
                  <b>During training:</b> regular intake based on sweat, thirst and session intensity.
                </p>
                <p>
                  <b>After training:</b> rehydrate post-session; future layer can use pre/post bodyweight.
                </p>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Hydration status
                </p>
                <p className="mt-1 text-2xl font-black">Good</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        icon={Activity}
        title="Coach Dashboard"
        subtitle="Central command screen for classification, readiness, alerts, assessment status and training load."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Members" value={totalMembers} icon={Users} />
        <MetricCard label="BASE" value={baseCount} icon={ShieldCheck} />
        <MetricCard label="FITNESS" value={fitnessCount} icon={Activity} />
        <MetricCard
          label="PERFORMANCE"
          value={performanceCount}
          icon={TrendingUp}
        />
      </div>

      <Card className="mt-5 rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Current classification
              </p>
              <h3 className="mt-2 text-3xl font-black">
                {selectedMember.name} is currently in {selectedMember.phase} phase
              </h3>
              <p className="mt-3 max-w-2xl text-sm text-slate-500">
                Based on FMS, VO₂/cardiorespiratory capacity, pain levels, movement quality and training history.
              </p>
            </div>
            <Badge
              tone={
                selectedMember.phase === "UNCLASSIFIED"
                  ? "unclassified"
                  : selectedMember.phase.toLowerCase()
              }
            >
              {selectedMember.phase}
            </Badge>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Mini label="FMS" value={selectedMember.fms} />
            <Mini label="Pain NPRS" value={selectedMember.pain} />
            <Mini
              label="VO₂ / Cardio"
              value={selectedMember.vo2Estimate || selectedMember.cardio}
            />
            <Mini
              label="Training History"
              value={selectedMember.trainingHistory || selectedMember.trainingAge}
            />
            <Mini label="Readiness" value={selectedMember.readinessTrend} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <AlertCard
          title="Readiness Alert"
          text="Low hydration or high soreness reduces training readiness and flags session modification."
        />
        <AlertCard
          title="Assessment Reminder"
          text="Retest performance, FMS, mobility/flexibility, cardio and body composition every 4–6 weeks."
        />
        <AlertCard
          title="Programming Rule"
          text="No auto templates. Coach uploads PDF/Excel plan and tracks actual session data."
        />
      </div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black capitalize">{value}</p>
    </div>
  );
}

function AlertCard({ title, text }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <h4 className="font-black">{title}</h4>
        <p className="mt-2 text-sm text-slate-500">{text}</p>
      </CardContent>
    </Card>
  );
}

function Members({
  members,
  setMembers,
  search,
  setSearch,
  setSelectedMemberId,
  session,
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "male",
    dob: "",
    age: "",
    goal: "Fat Loss",
    readinessTrend: "stable",
  });

  const [creating, setCreating] = useState(false);
  const [createdMember, setCreatedMember] = useState(null);
  const [createError, setCreateError] = useState("");

  async function addMember() {
    setCreateError("");
    setCreatedMember(null);

    if (!supabase || !session?.user?.id) {
      setCreateError("Not signed in, or Supabase not configured");
      return;
    }

    if (!form.name.trim()) {
      setCreateError("Enter full name");
      return;
    }

    const phone = normalizePhoneE164(form.phone);
    if (!phone) {
      setCreateError("Enter phone in E.164 format (e.g. +919876543210)");
      return;
    }

    setCreating(true);
    try {
      const calculatedAge = calculateAgeFromDOB(form.dob);
      const memberCode = generateMemberCode();

      const payload = {
        coach_id: session.user.id,
        member_code: memberCode,
        full_name: normalizeFullName(form.name),
        phone,
        gender: form.gender,
        dob: form.dob || null,
        age: Number(calculatedAge || form.age || 0) || null,
        goal: form.goal,
        readiness_trend: form.readinessTrend,
        phase: "UNCLASSIFIED",
        status: "Active",
        renewal: "2026-07-01",
      };

      const { data, error } = await supabase
        .from("members")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      const uiMember = {
        id: data.id,
        memberCode: data.member_code,
        phone: data.phone,
        name: data.full_name,
        gender: data.gender || "male",
        dob: data.dob || "",
        age: data.age ?? "",
        goal: data.goal || "Fat Loss",
        readinessTrend: data.readiness_trend || "stable",
        fms: "Not assessed",
        pain: "Not assessed",
        cardioCapacity: "Not assessed",
        vo2Estimate: "Not assessed",
        movementQuality: "Not assessed",
        trainingHistory: "Not assessed",
        phase: data.phase || "UNCLASSIFIED",
        status: data.status || "Active",
        renewal: data.renewal || "",
      };

      setMembers((prev) => [uiMember, ...prev]);
      setSelectedMemberId(String(uiMember.id));
      setCreatedMember({ memberCode, phone });

      setForm({
        name: "",
        phone: "",
        gender: "male",
        dob: "",
        age: "",
        goal: "Fat Loss",
        readinessTrend: "stable",
      });
    } catch (e) {
      const msg = e?.message || "Failed to create member";
      if (msg.includes("Could not find the table 'public.members'")) {
        setCreateError(
          "Supabase DB not initialized: run supabase/schema.sql in Supabase SQL Editor, then go to Settings → API → Reload schema cache.",
        );
      } else {
        setCreateError(msg);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <SectionTitle
        icon={Users}
        title="Members"
        subtitle="Add member profile details here. BASE / FITNESS / PERFORMANCE classification is completed inside the Assessment Lab."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <h3 className="text-lg font-black">Add New Member</h3>
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Phone (e.g. +919876543210)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">Gender</p>
              <Select
                value={form.gender}
                onChange={(v) => setForm({ ...form, gender: v })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">Date of Birth</p>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dob: e.target.value,
                    age: calculateAgeFromDOB(e.target.value),
                  })
                }
              />
            </div>
            <Input
              placeholder="Age auto-calculated from DOB"
              type="number"
              value={form.age}
              readOnly
            />
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">Goal</p>
              <Select value={form.goal} onChange={(v) => setForm({ ...form, goal: v })}>
                {goalOptions.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addMember}
                disabled={creating}
                className="flex-1 rounded-2xl bg-slate-950"
              >
                <Plus size={16} className="mr-2" />
                {creating ? "Creating…" : "Create Member"}
              </Button>
            </div>

            {createError && (
              <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                {createError}
              </div>
            )}

            {createdMember && (
              <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
                <p className="font-bold">Member created</p>
                <p className="mt-1">
                  Member ID: <span className="font-black">{createdMember.memberCode}</span>
                </p>
                <p className="text-xs text-emerald-900/70">
                  Member logs in with this ID + {createdMember.phone}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 px-3">
              <Search size={16} className="text-slate-400" />
              <input
                className="w-full py-3 text-sm outline-none"
                placeholder="Search members"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black">{m.name}</p>
                      <p className="text-sm text-slate-500">{m.goal}</p>
                      {m.memberCode && (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Member ID: <span className="font-black text-slate-700">{m.memberCode}</span>
                        </p>
                      )}
                    </div>
                    <Badge
                      tone={
                        m.phase === "UNCLASSIFIED" ? "unclassified" : m.phase.toLowerCase()
                      }
                    >
                      {m.phase}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberProfile({ selectedMember }) {
  return (
    <div>
      <SectionTitle
        icon={Users}
        title="My Profile"
        subtitle="Your basic details as entered by the coach/admin."
      />
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Member Details
              </p>
              <h3 className="mt-1 text-3xl font-black">{selectedMember.name}</h3>
            </div>
            <Badge
              tone={
                selectedMember.phase === "UNCLASSIFIED"
                  ? "unclassified"
                  : selectedMember.phase.toLowerCase()
              }
            >
              {selectedMember.phase}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Mini label="Name" value={selectedMember.name || "—"} />
            <Mini label="Age" value={selectedMember.age || "—"} />
            <Mini label="Gender" value={selectedMember.gender || "—"} />
            <Mini label="Goal" value={selectedMember.goal || "—"} />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            These details are reflected from the coach/admin member form. Classification and assessment scores are updated from the Assessment Lab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Recovery({ selectedMember }) {
  const journalQuestions = [
    {
      label: "How many hours did you sleep last night?",
      key: "sleepHours",
      type: "slider",
      min: 0,
      max: 12,
      step: 0.5,
      emoji: "😴",
      principle: "Sleep duration supports recovery and performance readiness.",
    },
    {
      label: "How would you rate your sleep quality?",
      key: "sleepQuality",
      type: "score",
      emoji: "🛌",
      principle: "Sleep quality is used as a recovery marker in athlete monitoring research.",
    },
    {
      label: "How is your mood today?",
      key: "mood",
      type: "score",
      emoji: "🙂",
      principle: "Mood state is a psychometric readiness signal.",
    },
    {
      label: "How motivated do you feel to train today?",
      key: "motivation",
      type: "score",
      emoji: "⚡",
      principle: "Motivation reflects psychological readiness and training tolerance.",
    },
    {
      label: "How sore or painful does your body feel today?",
      key: "soreness",
      type: "scoreReverse",
      emoji: "🦵",
      principle: "Scored using NPRS/VAS logic: higher pain/soreness lowers readiness.",
    },
    {
      label: "How fatigued do you feel today?",
      key: "fatigue",
      type: "scoreReverse",
      emoji: "🧠",
      principle: "Fatigue is treated like a subjective VAS/NPRS-style load signal.",
    },
    {
      label: "How hydrated do you feel?",
      key: "hydration",
      type: "hydration",
      emoji: "💧",
      principle: "Hydration follows ACSM-style pre/during/post fluid replacement principles.",
    },
    {
      label: "What is your urine colour today?",
      key: "urineColor",
      type: "urine",
      emoji: "🚽",
      principle: "Urine colour is used as a simple hydration status marker.",
    },
    {
      label: "Are you feeling thirsty?",
      key: "thirst",
      type: "thirst",
      emoji: "🥤",
      principle: "Thirst is treated as a hydration warning signal.",
    },
  ];

  const [data, setData] = useState({
    date: new Date().toISOString().slice(0, 10),
    sleepHours: 7,
    sleepQuality: 7,
    mood: 7,
    motivation: 7,
    soreness: 2,
    fatigue: 3,
    hydration: "good",
    urineColor: "pale",
    thirst: "none",
  });

  const score = readinessScore(data);
  const readiness = readinessInterpretation(score);
  const sleepSubscore = getSleepSubscore(data.sleepHours, data.sleepQuality);
  const moodSubscore = getMoodSubscore(data.mood, data.motivation);
  const sorenessFatigueSubscore = getSorenessFatigueSubscore(data.soreness, data.fatigue);
  const hydrationSubscore = getHydrationSubscore(data.hydration, data.urineColor, data.thirst);

  return (
    <div>
      <SectionTitle
        icon={Droplets}
        title="Recovery / Daily Journal"
        subtitle="WHOOP-style daily check-in for sleep, mood, soreness, hydration and tiredness."
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-black">Daily Journal — {selectedMember.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Fill this before training to calculate daily readiness.
                </p>
              </div>
              <div className="w-full md:w-[190px]">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Date
                </p>
                <Input
                  type="date"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              {journalQuestions.map((q) => (
                <div
                  key={q.key}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                      {q.emoji}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900">{q.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{q.principle}</p>
                    </div>
                  </div>

                  {(q.type === "score" || q.type === "scoreReverse") && (
                    <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          onClick={() => setData({ ...data, [q.key]: n })}
                          className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${Number(data[q.key]) === n ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === "slider" && (
                    <div>
                      <input
                        type="range"
                        min={q.min}
                        max={q.max}
                        step={q.step}
                        value={data[q.key]}
                        onChange={(e) => setData({ ...data, [q.key]: e.target.value })}
                        className="w-full"
                      />
                      <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-500">
                        <span>0 h</span>
                        <span className="text-lg font-black text-slate-950">
                          {data[q.key]} h
                        </span>
                        <span>12 h</span>
                      </div>
                    </div>
                  )}

                  {q.type === "hydration" && (
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ["good", "Well Hydrated", "Pale urine / good fluid intake"],
                        ["moderate", "Moderate", "Slight thirst / yellow urine"],
                        ["low", "Low Hydration", "Dark urine / dehydrated"],
                      ].map(([value, title, desc]) => (
                        <button
                          key={value}
                          onClick={() => setData({ ...data, hydration: value })}
                          className={`rounded-3xl border p-4 text-left transition ${data.hydration === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                        >
                          <p className="font-black">{title}</p>
                          <p
                            className={`mt-1 text-xs ${data.hydration === value ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === "urine" && (
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ["pale", "Pale / Light", "Generally hydrated"],
                        ["yellow", "Yellow", "Monitor fluids"],
                        ["dark", "Dark Yellow", "Hydration penalty"],
                      ].map(([value, title, desc]) => (
                        <button
                          key={value}
                          onClick={() => setData({ ...data, urineColor: value })}
                          className={`rounded-3xl border p-4 text-left transition ${data.urineColor === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                        >
                          <p className="font-black">{title}</p>
                          <p
                            className={`mt-1 text-xs ${data.urineColor === value ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === "thirst" && (
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ["none", "No thirst", "No penalty"],
                        ["mild", "Mild thirst", "Small penalty"],
                        ["high", "High thirst", "Hydration warning"],
                      ].map(([value, title, desc]) => (
                        <button
                          key={value}
                          onClick={() => setData({ ...data, thirst: value })}
                          className={`rounded-3xl border p-4 text-left transition ${data.thirst === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                        >
                          <p className="font-black">{title}</p>
                          <p
                            className={`mt-1 text-xs ${data.thirst === value ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <SaveButton className="mt-5 w-full">Save Daily Readiness</SaveButton>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-slate-500">
              Scientific Readiness Output for {data.date}
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-7xl font-black">{score}</span>
              <span className="pb-3 text-slate-400">/100</span>
            </div>
            <div className="mt-5 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-slate-950"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="mt-4">
              <Badge tone={readiness.tone}>{readiness.label}</Badge>
            </div>
            <p className="mt-4 text-sm text-slate-600">{readiness.advice}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <Mini label="Sleep Score" value={`${sleepSubscore}/100`} />
              <Mini label="Mood/Motivation" value={`${moodSubscore}/100`} />
              <Mini
                label="Soreness/Fatigue"
                value={`${sorenessFatigueSubscore}/100`}
              />
              <Mini label="Hydration" value={`${hydrationSubscore}/100`} />
            </div>

            <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
              <b>Hydration protocol:</b> Begin training euhydrated, use thirst/urine colour as simple checks, take regular fluid during training, and rehydrate after session. Low hydration, dark urine or high thirst reduces readiness.
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
              Scoring model: Sleep 30%, mood/motivation 25%, soreness/fatigue 25%, hydration 20%.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Assessments({ selectedMember }) {
  const tabs = [
    "Classification",
    "Body Composition",
    "Performance",
    "Mobility / Flexibility",
    "Strength",
    "Cardio / VO2",
    "Posture",
    "Gait",
    "Balance / Proprioception",
    "Notes",
  ];
  const [active, setActive] = useState(tabs[0]);
  return (
    <div>
      <SectionTitle
        icon={ClipboardList}
        title="Assessment Lab"
        subtitle="Full testing system for body composition, performance, movement, strength, cardio, posture, gait and notes."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`rounded-2xl px-4 py-2 text-sm font-bold ${active === t ? "bg-slate-950 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <AssessmentFields active={active} selectedMember={selectedMember} />
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentFields({ active, selectedMember }) {
  const [saved, setSaved] = useState(false);
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(selectedMember.age || 30);
  const [cardioMethod, setCardioMethod] = useState("fox");
  const [selectedMobilityTest, setSelectedMobilityTest] = useState("Sit & Reach");
  const [selectedBalanceTest, setSelectedBalanceTest] = useState("Y Balance Test");

  const [classificationData, setClassificationData] = useState({
    deepSquat: 2,
    hurdleStep: 2,
    inlineLunge: 2,
    shoulderMobility: 2,
    activeStraightLegRaise: 2,
    trunkStabilityPushup: 2,
    rotaryStability: 2,
    pain: selectedMember.pain === "Not assessed" ? 0 : selectedMember.pain || 0,
    vo2Estimate:
      selectedMember.vo2Estimate === "Not assessed"
        ? 35
        : selectedMember.vo2Estimate || 35,
    movementQuality:
      selectedMember.movementQuality === "Not assessed"
        ? "moderate"
        : selectedMember.movementQuality || "moderate",
    trainingHistory:
      selectedMember.trainingHistory === "Not assessed"
        ? "general_activity"
        : selectedMember.trainingHistory || "general_activity",
  });

  function saveSection() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const maxHR =
    cardioMethod === "tanaka"
      ? Math.round(208 - 0.7 * Number(age || 0))
      : Math.round(220 - Number(age || 0));

  const edwardsZones = [
    ["Zone 1", "50–60%", Math.round(maxHR * 0.5), Math.round(maxHR * 0.6)],
    ["Zone 2", "60–70%", Math.round(maxHR * 0.6), Math.round(maxHR * 0.7)],
    ["Zone 3", "70–80%", Math.round(maxHR * 0.7), Math.round(maxHR * 0.8)],
    ["Zone 4", "80–90%", Math.round(maxHR * 0.8), Math.round(maxHR * 0.9)],
    ["Zone 5", "90–100%", Math.round(maxHR * 0.9), maxHR],
  ];

  const fmsBattery = [
    ["Deep Squat", "deepSquat"],
    ["Hurdle Step", "hurdleStep"],
    ["Inline Lunge", "inlineLunge"],
    ["Shoulder Mobility", "shoulderMobility"],
    ["Active Straight Leg Raise", "activeStraightLegRaise"],
    ["Trunk Stability Push-up", "trunkStabilityPushup"],
    ["Rotary Stability", "rotaryStability"],
  ];

  const fmsTotal = fmsBattery.reduce(
    (sum, [, key]) => sum + Number(classificationData[key] || 0),
    0,
  );
  const cardioCategory = getCardioCategoryFromVO2(classificationData.vo2Estimate);
  const calculatedPhase = classifyMember({ ...classificationData, fmsTotal });

  const genericFields = {
    Strength: [
      "Squat 1RM / 5RM / submax",
      "Deadlift 1RM / 5RM / submax",
      "Bench 1RM / 5RM / submax",
      "Pull strength",
      "Coach notes",
    ],
    Posture: [
      "Physiocode posture notes",
      "Head position",
      "Shoulder position",
      "Pelvis position",
      "Knee position",
      "Foot position",
    ],
    Gait: [
      "Dartfish gait notes",
      "Stride",
      "Cadence",
      "Foot strike",
      "Asymmetry",
    ],
    Notes: ["Coach notes", "Pain notes", "Retest date", "Action plan"],
  };

  const mobilityTests = {
    "Sit & Reach": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Sit & Reach Test</h4>
        <p className="text-sm text-slate-500">
          Hamstring + posterior chain flexibility assessment.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="number" placeholder="Right / Dominant side score in cm" />
          <Input type="number" placeholder="Left / Non-dominant side score in cm" />
        </div>
        <Input placeholder="Side-to-side difference / asymmetry notes" />
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none"
          placeholder="Clinical notes / compensations"
        />
      </div>
    ),
    "Modified Thomas Test": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Modified Thomas Test</h4>
        <p className="text-sm text-slate-500">
          Hip flexor length and anterior chain assessment.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right hip flexor finding" />
          <Input placeholder="Left hip flexor finding" />
          <Input placeholder="Right rectus femoris finding" />
          <Input placeholder="Left rectus femoris finding" />
        </div>
        <Input placeholder="Pelvic tilt / compensation notes" />
      </div>
    ),
    "DF Lunge Test": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">DF Lunge Test</h4>
        <p className="text-sm text-slate-500">
          Ankle dorsiflexion mobility assessment.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="number" placeholder="Right ankle DF lunge" />
          <Input type="number" placeholder="Left ankle DF lunge" />
        </div>
        <Input placeholder="Restriction / stiffness notes" />
      </div>
    ),
    "AKT / Active Knee Extension": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">AKT / Active Knee Extension</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right knee extension angle" />
          <Input placeholder="Left knee extension angle" />
        </div>
        <Input placeholder="Hamstring restriction notes" />
      </div>
    ),
    "FABER Test": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">FABER Test</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right FABER finding" />
          <Input placeholder="Left FABER finding" />
        </div>
        <Input placeholder="Hip/SIJ provocation notes" />
      </div>
    ),
    "Shoulder IR / ER": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Shoulder Internal / External Rotation</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right IR" />
          <Input placeholder="Left IR" />
          <Input placeholder="Right ER" />
          <Input placeholder="Left ER" />
        </div>
      </div>
    ),
    "Thoracic Mobility": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Thoracic Mobility</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right thoracic rotation" />
          <Input placeholder="Left thoracic rotation" />
        </div>
        <Input placeholder="Thoracic extension mobility" />
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none"
          placeholder="Compensation patterns"
        />
      </div>
    ),
    "Hip IR / ER": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Hip Internal / External Rotation</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right Hip IR" />
          <Input placeholder="Left Hip IR" />
          <Input placeholder="Right Hip ER" />
          <Input placeholder="Left Hip ER" />
        </div>
      </div>
    ),
    "Ankle Dorsi / Plantar": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Ankle Dorsi / Plantar Flexion</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right Dorsiflexion" />
          <Input placeholder="Left Dorsiflexion" />
          <Input placeholder="Right Plantarflexion" />
          <Input placeholder="Left Plantarflexion" />
        </div>
      </div>
    ),
    "Elbow Hyperextension": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Elbow Hyperextension</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right elbow hyperextension" />
          <Input placeholder="Left elbow hyperextension" />
        </div>
      </div>
    ),
    "Knee Hyperextension": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Knee Hyperextension</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right knee hyperextension" />
          <Input placeholder="Left knee hyperextension" />
        </div>
      </div>
    ),
    "Knee Valgus": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Dynamic Knee Valgus</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right single-leg squat valgus" />
          <Input placeholder="Left single-leg squat valgus" />
          <Input placeholder="Right landing valgus" />
          <Input placeholder="Left landing valgus" />
        </div>
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none"
          placeholder="Movement compensation notes"
        />
      </div>
    ),
  };

  const balanceTests = {
    "Y Balance Test": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Y Balance Test</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Anterior reach" />
          <Input placeholder="Posteromedial reach" />
          <Input placeholder="Posterolateral reach" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right limb composite score" />
          <Input placeholder="Left limb composite score" />
        </div>
      </div>
    ),
    "Star Excursion Test": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Star Excursion Test</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Right limb findings" />
          <Input placeholder="Left limb findings" />
        </div>
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none"
          placeholder="Reach asymmetry, stability deficits, compensation patterns"
        />
      </div>
    ),
    "Sharpened Romberg Test": (
      <div className="space-y-4">
        <h4 className="text-xl font-black">Sharpened Romberg Test</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Eyes open duration" />
          <Input placeholder="Eyes closed duration" />
        </div>
        <Input placeholder="Postural sway / vestibular notes" />
      </div>
    ),
  };

  return (
    <div>
      <div className="sticky top-3 z-10 mb-4 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black">
              {active} — {selectedMember.name}
            </h3>
            <p className="text-xs text-slate-500">Enter assessment data and save this section.</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <Badge tone="performance">
                <CheckCircle2 size={14} className="mr-1" /> Saved
              </Badge>
            )}
            <Button onClick={saveSection} className="rounded-2xl bg-slate-950">
              <Save size={16} className="mr-2" /> Save {active}
            </Button>
          </div>
        </div>
      </div>

      {active === "Classification" && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-black">ACE-IFT Classification Engine</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Classification is calculated from assessment inputs, not manually selected in the member form.
                </p>
              </div>
              <Badge tone={calculatedPhase.toLowerCase()}>{calculatedPhase}</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4 space-y-3">
              <h4 className="font-black">FMS Battery + Pain</h4>
              <Select
                value={classificationData.movementQuality}
                onChange={(v) => setClassificationData({ ...classificationData, movementQuality: v })}
              >
                <option value="poor">Poor movement competency</option>
                <option value="moderate">Moderate movement competency</option>
                <option value="advanced">Advanced movement competency</option>
              </Select>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-slate-400">FMS Test Battery</p>
                  <Badge tone="dark">Final FMS: {fmsTotal}/21</Badge>
                </div>
                <div className="space-y-2">
                  {fmsBattery.map(([label, key]) => (
                    <div key={key} className="grid grid-cols-[1fr_110px] items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                      <Select
                        value={classificationData[key]}
                        onChange={(v) =>
                          setClassificationData({ ...classificationData, [key]: Number(v) })
                        }
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              <Input
                placeholder="Pain NPRS 0–10"
                type="number"
                value={classificationData.pain}
                onChange={(e) =>
                  setClassificationData({ ...classificationData, pain: e.target.value })
                }
              />
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 space-y-3">
              <h4 className="font-black">VO₂ Max + Training History</h4>
              <Input
                type="number"
                value={classificationData.vo2Estimate}
                onChange={(e) =>
                  setClassificationData({ ...classificationData, vo2Estimate: e.target.value })
                }
                placeholder="VO₂ max estimate ml/kg/min"
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase text-slate-400">Cardiorespiratory Classification</p>
                <p className="mt-2 text-lg font-black capitalize">
                  {cardioCategory.replaceAll("_", " ")}
                </p>
              </div>
              <Select
                value={classificationData.trainingHistory}
                onChange={(v) => setClassificationData({ ...classificationData, trainingHistory: v })}
              >
                <option value="sedentary">Sedentary / low activity</option>
                <option value="general_activity">General fitness exposure</option>
                <option value="structured_training">Structured performance training</option>
              </Select>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h4 className="font-black">User Output</h4>
            <p className="mt-2 text-sm text-slate-600">
              You are currently in <b>{calculatedPhase}</b> phase based on FMS final score, VO₂ max estimate, pain levels, movement quality and training history.
            </p>
          </div>
        </div>
      )}

      {active === "Body Composition" && (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={gender} onChange={setGender}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
            <Input type="number" placeholder="Body Weight in kg — digital weighing machine" />
            <Input value="Jackson-Pollock 3-site method" readOnly />
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Skinfold Sites — Auto-selected by Gender</h4>
            <div className="grid gap-3 md:grid-cols-3">
              {(gender === "male"
                ? ["Chest skinfold", "Abdomen skinfold", "Thigh skinfold"]
                : ["Triceps skinfold", "Suprailiac skinfold", "Thigh skinfold"]
              ).map((site) => (
                <Input key={site} type="number" placeholder={`${site} in mm`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {active === "Performance" && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Jumps — OUTPUT Device</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="number" placeholder="CMJ height in cm" />
              <Input type="number" placeholder="Squat Jump height in cm" />
              <Input type="number" placeholder="Broad Jump in cm" />
              <Input type="number" placeholder="RSI / Reactive Strength Index" />
              <Input type="number" placeholder="LESS Score" />
              <Input placeholder="Jump notes / asymmetry" />
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Sprint — Stopwatch</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="number" placeholder="10m sprint time in seconds" />
              <Input type="number" placeholder="20m sprint time in seconds" />
              <Input placeholder="Sprint notes" />
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Grip Strength — Handheld Dynamometer</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="number" placeholder="Left hand kg" />
              <Input type="number" placeholder="Right hand kg" />
              <Input type="number" placeholder="Best score kg" />
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Muscular Endurance</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="number" placeholder="Push-ups reps" />
              <Input type="number" placeholder="Squat / sit-to-stand reps" />
              <Input type="number" placeholder="Pull-up / row reps" />
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Core Strength — McGill Torso Endurance</h4>
            <div className="grid gap-3 md:grid-cols-4">
              <Input type="number" placeholder="Flexor endurance sec" />
              <Input type="number" placeholder="Extensor endurance sec" />
              <Input type="number" placeholder="Right side plank sec" />
              <Input type="number" placeholder="Left side plank sec" />
            </div>
          </div>
        </div>
      )}

      {active === "Mobility / Flexibility" && (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
              Tests / Joints
            </h4>
            <div className="space-y-2">
              {Object.keys(mobilityTests).map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedMobilityTest(item)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${selectedMobilityTest === item ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            {mobilityTests[selectedMobilityTest]}
          </div>
        </div>
      )}

      {active === "Balance / Proprioception" && (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
              Balance Tests
            </h4>
            <div className="space-y-2">
              {Object.keys(balanceTests).map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedBalanceTest(item)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${selectedBalanceTest === item ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            {balanceTests[selectedBalanceTest]}
          </div>
        </div>
      )}

      {active === "Cardio / VO2" && (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
            <Select value={cardioMethod} onChange={setCardioMethod}>
              <option value="fox">220 - age</option>
              <option value="tanaka">208 - 0.7 × age</option>
            </Select>
            <Input value={`${maxHR} bpm`} readOnly />
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Testing Device — Frontier Chest Strap</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="number" placeholder="Resting HR bpm" />
              <Input type="number" placeholder="Average test HR bpm" />
              <Input type="number" placeholder="Peak HR bpm" />
              <Input type="number" placeholder="VO2 estimate" />
              <Input type="number" placeholder="Breathing rate" />
              <Input placeholder="Test protocol notes" />
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <h4 className="mb-3 font-black">Edwards 5-Zone HR Scale</h4>
            <div className="grid gap-2">
              {edwardsZones.map(([zone, pct, low, high]) => (
                <div key={zone} className="grid grid-cols-3 rounded-2xl bg-white p-3 text-sm">
                  <b>{zone}</b>
                  <span className="text-slate-500">{pct} HRmax</span>
                  <span className="font-bold">
                    {low}–{high} bpm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {genericFields[active] && (
        <div className="grid gap-3 md:grid-cols-2">
          {genericFields[active].map((f) => (
            <Input key={f} placeholder={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function Programming({ selectedMember }) {
  return (
    <div>
      <SectionTitle
        icon={FileSpreadsheet}
        title="Programming"
        subtitle="Coach-owned programming system. Upload PDF/Excel plans. No auto-generated templates."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-lg font-black">Upload Plan — {selectedMember.name}</h3>
            <div className="mt-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Upload className="mx-auto text-slate-400" />
              <p className="mt-3 font-bold">Upload PDF / Excel</p>
              <p className="text-sm text-slate-500">Program file saved to member profile.</p>
              <Input type="file" className="mt-4" accept=".pdf,.xlsx,.xls" />
            </div>
            <SaveButton className="mt-4 w-full">Save Plan</SaveButton>
          </CardContent>
        </Card>
        <CalendarPlanner />
      </div>
    </div>
  );
}

function CalendarPlanner() {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardContent className="p-5 space-y-3">
        <h3 className="text-lg font-black">Calendar Planning</h3>
        <Input type="date" />
        <Select value="moderate" onChange={() => {}}>
          <option value="easy">Easy Day</option>
          <option value="moderate">Moderate Day</option>
          <option value="hard">Hard Day</option>
        </Select>
        <Input placeholder="Session focus e.g. Lower Strength + Zone 2" />
        <Input placeholder="RPE-based load target e.g. RPE 7" />
        <SaveButton className="w-full">Save Session Plan</SaveButton>
      </CardContent>
    </Card>
  );
}

function Training({ selectedMember }) {
  const [rows, setRows] = useState([
    {
      category: "Lower Body — Squat Pattern",
      exercise: "Back Squat",
      sets: 3,
      reps: 5,
      load: 100,
      rest: "2–3 min",
    },
  ]);
  const total = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + Number(r.sets || 0) * Number(r.reps || 0) * Number(r.load || 0),
        0,
      ),
    [rows],
  );
  function update(i, key, value) {
    setRows(
      rows.map((r, idx) => {
        if (idx !== i) return r;
        if (key === "category") return { ...r, category: value, exercise: exerciseCategories[value][0] };
        return { ...r, [key]: value };
      }),
    );
  }
  return (
    <div>
      <SectionTitle
        icon={Dumbbell}
        title="Train"
        subtitle="View your coach-uploaded plan and log your completed sets, reps and load."
      />

      <Card className="mb-5 rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black">Your Current Plan</h3>
              <p className="mt-1 text-sm text-slate-500">
                Visible to member. Uploaded and controlled by coach/admin.
              </p>
            </div>
            <Badge tone="dark">View Only</Badge>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-700">
              Week 1 — Strength + Hybrid Conditioning
            </p>
            <p className="mt-2 text-sm text-slate-500">
              PDF/Excel plan uploaded by coach will appear here for the member to view before logging the workout.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Mini label="Today" value="Lower Strength" />
              <Mini label="Intensity" value="RPE 7" />
              <Mini label="Status" value="Pending" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black">Workout Tracker — {selectedMember.name}</h3>
            <Badge tone="dark">Session Volume: {total} kg</Badge>
          </div>
          <div className="space-y-3">
            <div className="mb-3 hidden rounded-2xl bg-slate-100 px-3 py-3 md:grid md:grid-cols-7 md:gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Category</p>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Exercise</p>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Sets</p>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Reps</p>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Load</p>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Rest</p>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Volume</p>
            </div>

            {rows.map((r, i) => {
              const volume = Number(r.sets || 0) * Number(r.reps || 0) * Number(r.load || 0);
              return (
                <div
                  key={i}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-7 md:items-center"
                >
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400 md:hidden">
                      Category
                    </p>
                    <Select value={r.category} onChange={(v) => update(i, "category", v)}>
                      {Object.keys(exerciseCategories).map((cat) => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400 md:hidden">
                      Exercise
                    </p>
                    <Select value={r.exercise} onChange={(v) => update(i, "exercise", v)}>
                      {exerciseCategories[r.category].map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400 md:hidden">
                      Sets
                    </p>
                    <Input
                      type="number"
                      value={r.sets}
                      onChange={(e) => update(i, "sets", e.target.value)}
                      placeholder="Sets"
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400 md:hidden">
                      Reps
                    </p>
                    <Input
                      type="number"
                      value={r.reps}
                      onChange={(e) => update(i, "reps", e.target.value)}
                      placeholder="Reps"
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400 md:hidden">
                      Load (kg)
                    </p>
                    <Input
                      type="number"
                      value={r.load}
                      onChange={(e) => update(i, "load", e.target.value)}
                      placeholder="Load"
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400 md:hidden">
                      Rest
                    </p>
                    <Input
                      value={r.rest}
                      onChange={(e) => update(i, "rest", e.target.value)}
                      placeholder="Rest"
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400 md:hidden">
                      Volume
                    </p>
                    <div className="rounded-xl bg-white px-3 py-2 text-sm font-black">
                      {volume} kg
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() =>
                setRows([
                  ...rows,
                  {
                    category: "Lower Body — Squat Pattern",
                    exercise: "Goblet Squat",
                    sets: 3,
                    reps: 10,
                    load: 24,
                    rest: "90 sec",
                  },
                ])
              }
            >
              <Plus size={16} className="mr-2" /> Add Exercise
            </Button>
            <SaveButton>Save Workout</SaveButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MemberAssessments({ selectedMember }) {
  return (
    <div>
      <SectionTitle
        icon={ClipboardList}
        title="My Assessments"
        subtitle="Your assessment scores and how you compare against reference bands. Exact norms can be refined by age, sex, sport and testing population."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Current Category" value={selectedMember.phase} icon={ShieldCheck} />
        <MetricCard label="Latest Readiness" value="82/100" icon={Droplets} />
        <MetricCard label="Assessment Status" value="Updated" icon={CheckCircle2} />
      </div>

      <Card className="mt-5 rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-black">Scorecard vs Normative Bands</h3>
          <p className="mt-1 text-sm text-slate-500">
            Competitive view using organised reference bands. Future version can plug in SAI / OGQ / sport-specific databases where available.
          </p>
          <div className="mt-5 space-y-3">
            {normativeBands.map((row) => (
              <div
                key={row.test}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4 md:items-center"
              >
                <div>
                  <p className="font-black">{row.test}</p>
                  <p className="text-xs text-slate-500">{row.note}</p>
                </div>
                <p className="text-lg font-black">{row.score}</p>
                <Badge
                  tone={row.rating.includes("Above") || row.rating === "Good" ? "performance" : "fitness"}
                >
                  {row.rating}
                </Badge>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-2/3 rounded-full bg-slate-950" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Progress({ selectedMember }) {
  return (
    <div>
      <SectionTitle
        icon={TrendingUp}
        title="Progress"
        subtitle="Scores and trends across readiness, movement, mobility, strength, athleticism and hybrid capacity."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Readiness" value="82" icon={Droplets} />
        <MetricCard label="Movement" value="74" icon={Activity} />
        <MetricCard label="Strength" value="81" icon={Dumbbell} />
        <MetricCard label="Mobility" value="68" icon={ClipboardList} />
        <MetricCard label="Athleticism" value="77" icon={TrendingUp} />
        <MetricCard label="Hybrid" value="72" icon={BarChart3} />
      </div>
      <Card className="mt-5 rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-black">{selectedMember.name} — Trend Notes</h3>
          <p className="mt-2 text-sm text-slate-500">
            Prototype scoring shown here. Future layer can become data-driven once enough member testing, readiness and training load history is collected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Reports({ members }) {
  return (
    <div>
      <SectionTitle
        icon={BarChart3}
        title="Reports"
        subtitle="Coach-facing summaries for assessment status, readiness flags, training load and member progression."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Assessment Due" value="6" icon={ClipboardList} />
        <MetricCard label="Low Readiness" value="3" icon={Droplets} />
        <MetricCard label="High Load Weeks" value="4" icon={Dumbbell} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-black">Generate & Export Reports</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create coach/client-ready reports for assessments, readiness and progression.
                </p>
              </div>
              <Badge tone="dark">PDF / Excel Ready</Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Button className="rounded-2xl bg-slate-950">
                <Save size={16} className="mr-2" /> Save Report
              </Button>
              <Button variant="outline" className="rounded-2xl border-slate-300">
                <FileSpreadsheet size={16} className="mr-2" /> Download Excel
              </Button>
              <Button variant="outline" className="rounded-2xl border-slate-300">
                <ClipboardList size={16} className="mr-2" /> Download PDF
              </Button>
              <Button variant="outline" className="rounded-2xl border-slate-300">
                <Upload size={16} className="mr-2" /> Generate Report
              </Button>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <h4 className="font-black">Send Report</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700">
                  Send via WhatsApp
                </Button>
                <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700">Send via Email</Button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input placeholder="Client email address" />
                <Input placeholder="Client WhatsApp number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-5 space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-black">{m.name}</p>
                  <p className="text-sm text-slate-500">{m.goal}</p>
                </div>
                <Badge tone={m.phase === "UNCLASSIFIED" ? "unclassified" : m.phase.toLowerCase()}>
                  {m.phase}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Admin({ members }) {
  return (
    <div>
      <SectionTitle
        icon={Lock}
        title="Admin / Billing"
        subtitle="Private owner-only layer for billing, renewals, revenue, lead pipeline and retention tracking."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="MRR" value="₹1.8L" icon={Wallet} />
        <MetricCard label="Renewals Due" value="5" icon={CalendarDays} />
        <MetricCard label="Leads" value="24" icon={Users} />
        <MetricCard label="Retention" value="86%" icon={TrendingUp} />
      </div>
      <Card className="mt-5 rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lock size={18} />
            <h3 className="text-lg font-black">Private Billing Table</h3>
          </div>
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-4"
              >
                <p className="font-black">{m.name}</p>
                <p className="text-sm text-slate-500">Status: {m.status}</p>
                <p className="text-sm text-slate-500">Renewal: {m.renewal}</p>
                <SaveButton className="bg-slate-950">Update Billing</SaveButton>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
