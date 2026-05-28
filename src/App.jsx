import { useEffect, useMemo, useRef, useState } from "react";
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

const parqQuestions = [
  "Has a doctor ever diagnosed you with a heart condition, high blood pressure, diabetes, asthma, or any other medical condition that may affect exercise?",
  "Do you experience chest pain, dizziness, fainting, or unusual shortness of breath during exercise or daily activity?",
  "Are you currently taking any prescribed medication for blood pressure, heart health, diabetes, thyroid, mental health, or any chronic condition?",
  "Do you currently have any pain, injury, surgery, or orthopedic issue involving your muscles, joints, spine, or ligaments that may worsen with exercise?",
  "Have you undergone surgery, hospitalization, or major medical treatment within the last 12 months?",
  "Has any doctor or healthcare professional ever advised you to avoid or modify exercise?",
  "Do you smoke, vape, chew tobacco, or consume alcohol frequently?",
  "Do you currently perform at least 150 minutes of physical activity/exercise per week?",
  "Do you regularly experience poor sleep, excessive stress, fatigue, or difficulty recovering from training?",
  "Are you currently pregnant, postpartum (<12 months), or managing a condition such as PCOS, anemia, or hormonal imbalance? (if applicable)",
];

const exerciseHistoryQuestions = [
  {
    label: "Frequency — days/week",
    key: "frequency",
    options: ["0 days/week", "1–2 days/week", "3–4 days/week", "5–6 days/week", "Daily"],
  },
  {
    label: "Intensity",
    key: "intensity",
    options: [
      "Light — easy effort / can talk comfortably",
      "Moderate — noticeable effort / breathing faster",
      "Vigorous — hard effort / short phrases only",
      "Mixed intensity — varies by session",
      "Not sure",
    ],
  },
  {
    label: "Time — average session duration",
    key: "time",
    options: ["<30 minutes", "30–45 minutes", "45–60 minutes", "60–90 minutes", ">90 minutes"],
  },
  {
    label: "Type",
    key: "type",
    options: [
      "Resistance training",
      "Cardio / endurance",
      "Sport",
      "Yoga / mobility",
      "Hybrid / mixed",
      "No current training",
    ],
  },
  {
    label: "Previous coaching / structured training exposure",
    key: "coachingExposure",
    options: [
      "None",
      "Basic gym exposure",
      "Worked with trainer",
      "Structured S&C program",
      "Competitive sport program",
    ],
  },
  {
    label: "Current weekly training schedule",
    key: "weeklySchedule",
    options: [
      "Irregular",
      "1–2 sessions/week",
      "3–4 sessions/week",
      "5+ sessions/week",
      "Sport-specific schedule",
    ],
  },
  {
    label: "Resistance training experience",
    key: "resistanceExperience",
    options: ["None", "Beginner", "Intermediate", "Advanced", "Competitive lifting / athlete"],
  },
  {
    label: "Cardio / endurance training experience",
    key: "cardioExperience",
    options: [
      "None",
      "Beginner",
      "Can sustain 20 minutes",
      "Regular endurance training",
      "Competitive endurance / hybrid athlete",
    ],
  },
];

const lifestyleQuestions = [
  { label: "Smoking status", key: "smoking", options: ["No", "Occasional", "Regular", "Former smoker"] },
  { label: "Alcohol consumption", key: "alcohol", options: ["No", "Occasional", "Weekly", "Frequent"] },
  { label: "Sleep schedule", key: "sleepSchedule", options: ["Regular 7–9 hours", "Irregular", "Less than 6 hours", "Shift work"] },
  { label: "Stress levels", key: "stress", options: ["Low", "Moderate", "High", "Very high"] },
  { label: "Occupation activity level", key: "occupationActivity", options: ["Sedentary desk work", "Lightly active", "Physically active", "Highly demanding"] },
  { label: "Previous injury history", key: "injuryHistory", options: ["No major injury", "Previous injury fully recovered", "Recurring issue", "Current active issue"] },
  { label: "Surgery history", key: "surgeryHistory", options: ["No", "Yes — more than 12 months ago", "Yes — within last 12 months"] },
  { label: "Current medications", key: "medications", options: ["No", "Yes — BP/heart", "Yes — diabetes/thyroid", "Yes — mental health", "Yes — other"] },
  { label: "Family history of cardiovascular disease", key: "familyCVD", options: ["No", "Yes", "Not sure"] },
  { label: "Diabetes / metabolic conditions", key: "metabolic", options: ["No", "Diabetes", "PCOS", "Thyroid", "Other / not sure"] },
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

function calculateJacksonPollock3Site({ gender, age, chest, abdomen, thigh, triceps, suprailiac }) {
  const a = Number(age || 30);
  const sum =
    gender === "male"
      ? Number(chest || 0) + Number(abdomen || 0) + Number(thigh || 0)
      : Number(triceps || 0) + Number(suprailiac || 0) + Number(thigh || 0);
  if (!sum) return "—";
  const density =
    gender === "male"
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * a
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * a;
  const bodyFat = 495 / density - 450;
  return Number.isFinite(bodyFat) ? bodyFat.toFixed(1) : "—";
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
  trainingHistory,
  postureDeviationScore = 0,
  cardioMinutes = 0,
  postureStatus = "moderate",
}) {
  const fmsNum = Number(fmsTotal || 0);
  const painNum = Number(pain || 0);
  const cardioCategory = getCardioCategoryFromVO2(vo2Estimate);
  const cardioDuration = Number(cardioMinutes || 0);
  const adjustedFMS = Math.max(0, fmsNum - Number(postureDeviationScore || 0));
  const movementBand = getMovementCompetency({ fmsTotal: adjustedFMS, pain: painNum });

  const isBase =
    adjustedFMS <= 14 ||
    painNum >= 4 ||
    cardioCategory === "low_cardio" ||
    cardioDuration < 20 ||
    movementBand === "limited" ||
    postureStatus === "poor" ||
    trainingHistory === "sedentary";

  const isPerformance =
    adjustedFMS >= 17 &&
    painNum <= 1 &&
    cardioCategory === "high_cardio" &&
    cardioDuration >= 20 &&
    movementBand === "advanced" &&
    postureStatus === "good" &&
    trainingHistory === "structured_training";

  if (isBase) return "BASE";
  if (isPerformance) return "PERFORMANCE";
  return "FITNESS";
}

function getMovementCompetency({ fmsTotal, pain }) {
  const fms = Number(fmsTotal || 0);
  const painScore = Number(pain || 0);
  if (painScore >= 4 || fms <= 10) return "limited";
  if (fms <= 15) return "moderate";
  return "advanced";
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

function Select({ value, onChange, children, ...props }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900"
    >
      {children}
    </select>
  );
}

function SaveButton({ children = "Save", className = "", onSave }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  async function handleSave() {
    if (!onSave) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      return;
    }
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Button
      onClick={handleSave}
      disabled={saving}
      className={`rounded-2xl bg-slate-950 ${className}`}
    >
      {saved ? (
        <CheckCircle2 size={16} className="mr-2" />
      ) : (
        <Save size={16} className="mr-2" />
      )}
      {saved ? "Saved" : saving ? "Saving…" : children}
    </Button>
  );
}

async function downloadPlanFile(member, plan) {
  if (supabase && plan?.storagePath && plan?.fileName) {
    const { data, error } = await supabase.storage
      .from("member-plans")
      .createSignedUrl(plan.storagePath, 60 * 10);
    if (error) throw error;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = plan.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  const content = `The Fitness Function — Training Plan

Member: ${member?.name || "—"}
Goal: ${member?.goal || "—"}
Plan: ${plan?.name || "No active plan uploaded"}
Type: ${plan?.type || "PDF / Excel"}
Status: ${plan?.status || "Pending coach upload"}`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${member?.name || "member"}-training-plan.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
    nutritionIntervention: row.nutrition_intervention || "No",
    readinessTrend: row.readiness_trend || "stable",
    healthCategory: row.health_category || "HEALTHY",
    phase: row.phase || "UNCLASSIFIED",
    status: row.status || "Active",
    renewal: row.renewal || "",
    fms: row.fms_total ?? "Not assessed",
    pain: row.pain_nprs ?? "Not assessed",
    cardio: "Not assessed",
    cardioCapacity: "Not assessed",
    vo2Estimate: row.vo2_estimate ?? "Not assessed",
    movementQuality: row.movement_quality ?? "Not assessed",
    trainingHistory: row.training_history ?? "Not assessed",
    trainingAge: "Not assessed",
    parqAnswers: row.parq_answers || {},
    lifestyleAnswers: row.lifestyle_answers || {},
    exerciseHistoryAnswers: row.exercise_history_answers || {},
    latestReadiness: row.latest_readiness || null,
    assessmentLab: row.assessment_lab || {},
    plans: row.plans || [],
    currentPlanId: row.current_plan_id || "",
    address: row.address || "",
    email: row.email || "",
    emergencyContactName: row.emergency_contact_name || "",
    emergencyContactNumber: row.emergency_contact_number || "",
    govtIdType: row.govt_id_type || "",
    govtIdNumber: row.govt_id_number || "",
    govtIdFile: row.govt_id_file || "",
  };
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
      memberCode: "",
      phone: "",
      age: "",
      gender: "",
      dob: "",
      goal: "",
      nutritionIntervention: "No",
      readinessTrend: "",
      healthCategory: "HEALTHY",
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
      parqAnswers: {},
      lifestyleAnswers: {},
      exerciseHistoryAnswers: {},
      latestReadiness: null,
      address: "",
      email: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      govtIdType: "",
      govtIdNumber: "",
      govtIdFile: "",
      assessmentLab: {},
      plans: [],
      currentPlanId: "",
    }),
    [],
  );

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
          ["signup", Users, "Signup"],
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
            {tab === "signup" && role === "coach" && (
              <MemberSignup
                setMembers={setMembers}
                setSelectedMemberId={setSelectedMemberId}
                session={session}
              />
            )}
            {tab === "profile" && <MemberProfile selectedMember={selectedMember} />}
            {tab === "recovery" && (
              <Recovery selectedMember={selectedMember} setMembers={setMembers} />
            )}
            {tab === "assessments" &&
              (role === "member" ? (
                <MemberAssessments selectedMember={selectedMember} />
              ) : (
                <Assessments
                  selectedMember={selectedMember}
                  setMembers={setMembers}
                />
              ))}
            {tab === "programming" && (
              <Programming
                selectedMember={selectedMember}
                setMembers={setMembers}
                session={session}
              />
            )}
            {tab === "train" && <Training selectedMember={selectedMember} />}
            {tab === "progress" && <Progress selectedMember={selectedMember} />}
            {tab === "reports" && <Reports members={members} session={session} />}
            {tab === "admin" && <Admin members={members} session={session} />}
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
            value={`${selectedMember.latestReadiness ?? sampleReadiness}/100`}
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
  const [parqAnswers, setParqAnswers] = useState({});
  const [lifestyleAnswers, setLifestyleAnswers] = useState({});
  const [exerciseHistoryAnswers, setExerciseHistoryAnswers] = useState({});
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "male",
    dob: "",
    age: "",
    goal: "Fat Loss",
    nutritionIntervention: "No",
    readinessTrend: "stable",
    healthCategory: "HEALTHY",
  });

  const [saving, setSaving] = useState(false);
  const [createdMember, setCreatedMember] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      gender: "male",
      dob: "",
      age: "",
      goal: "Fat Loss",
      nutritionIntervention: "No",
      readinessTrend: "stable",
      healthCategory: "HEALTHY",
    });
    setParqAnswers({});
    setLifestyleAnswers({});
    setExerciseHistoryAnswers({});
  }

  function startEdit(member) {
    setInfoMsg("");
    setErrorMsg("");
    setCreatedMember(null);
    setEditingId(String(member.id));
    setForm({
      name: member.name || "",
      phone: member.phone || "",
      gender: member.gender || "male",
      dob: member.dob || "",
      age: member.age || "",
      goal: member.goal || "Fat Loss",
      nutritionIntervention: member.nutritionIntervention || "No",
      readinessTrend: member.readinessTrend || "stable",
      healthCategory: member.healthCategory || "HEALTHY",
    });
    setParqAnswers(member.parqAnswers || {});
    setLifestyleAnswers(member.lifestyleAnswers || {});
    setExerciseHistoryAnswers(member.exerciseHistoryAnswers || {});
  }

  async function deleteMember(memberId) {
    setErrorMsg("");
    setInfoMsg("");
    if (!supabase || !session?.user?.id) {
      setErrorMsg("Not signed in, or Supabase not configured");
      return;
    }

    try {
      const { error } = await supabase.from("members").delete().eq("id", memberId);
      if (error) throw error;

      setMembers((prev) => prev.filter((m) => String(m.id) !== String(memberId)));
      setInfoMsg("Member deleted");
    } catch (e) {
      setErrorMsg(e?.message || "Failed to delete member");
    }
  }

  function formatDbSetupError(err) {
    const msg = err?.message || String(err || "");
    if (msg.includes("Could not find the table 'public.members'")) {
      return "Supabase DB not initialized: run supabase/schema.sql in Supabase SQL Editor, then go to Settings → API → Reload schema cache.";
    }
    return msg || "Database error";
  }

  function isMissingColumnError(err) {
    const msg = err?.message || String(err || "");
    return msg.includes("does not exist") && msg.includes("column");
  }

  async function saveMember() {
    setErrorMsg("");
    setInfoMsg("");
    setCreatedMember(null);

    if (!supabase || !session?.user?.id) {
      setErrorMsg("Not signed in, or Supabase not configured");
      return;
    }

    if (!form.name.trim()) {
      setErrorMsg("Enter full name");
      return;
    }

    const phone = normalizePhoneE164(form.phone);
    if (!phone) {
      setErrorMsg("Enter phone in E.164 format (e.g. +919876543210)");
      return;
    }

    setSaving(true);

    const calculatedAge = calculateAgeFromDOB(form.dob);
    const basePayload = {
      full_name: normalizeFullName(form.name),
      phone,
      gender: form.gender,
      dob: form.dob || null,
      age: Number(calculatedAge || form.age || 0) || null,
      goal: form.goal,
      readiness_trend: form.readinessTrend,
    };

    const extendedPayload = {
      nutrition_intervention: form.nutritionIntervention,
      health_category: form.healthCategory,
      parq_answers: parqAnswers,
      lifestyle_answers: lifestyleAnswers,
      exercise_history_answers: exerciseHistoryAnswers,
    };

    try {
      if (editingId) {
        const attemptPayload = { ...basePayload, ...extendedPayload };
        let result = await supabase
          .from("members")
          .update(attemptPayload)
          .eq("id", editingId)
          .select("*")
          .single();

        if (result.error && isMissingColumnError(result.error)) {
          result = await supabase
            .from("members")
            .update(basePayload)
            .eq("id", editingId)
            .select("*")
            .single();
          if (result.error) throw result.error;
          setInfoMsg("Saved. (Extra intake fields are not persisted until you update Supabase schema.)");
        }

        if (result.error) throw result.error;

        const updated = {
          ...mapMemberRow(result.data),
          parqAnswers,
          lifestyleAnswers,
          exerciseHistoryAnswers,
        };
        setMembers((prev) => prev.map((m) => (String(m.id) === String(updated.id) ? updated : m)));
        setSelectedMemberId(String(updated.id));
        setEditingId(null);
        setInfoMsg((prev) => prev || "Member updated");
      } else {
        const memberCode = generateMemberCode();
        const insertBase = {
          coach_id: session.user.id,
          member_code: memberCode,
          phase: "UNCLASSIFIED",
          status: "Active",
          renewal: "2026-07-01",
          ...basePayload,
        };

        const insertAttempt = { ...insertBase, ...extendedPayload };

        let result = await supabase.from("members").insert(insertAttempt).select("*").single();

        if (result.error && isMissingColumnError(result.error)) {
          result = await supabase.from("members").insert(insertBase).select("*").single();
          if (result.error) throw result.error;
          setInfoMsg("Created. (Extra intake fields are not persisted until you update Supabase schema.)");
        }

        if (result.error) throw result.error;

        const uiMember = {
          ...mapMemberRow(result.data),
          parqAnswers,
          lifestyleAnswers,
          exerciseHistoryAnswers,
          nutritionIntervention: form.nutritionIntervention,
          healthCategory: form.healthCategory,
        };

        setMembers((prev) => [uiMember, ...prev]);
        setSelectedMemberId(String(uiMember.id));
        setCreatedMember({ memberCode, phone });
        resetForm();
      }
    } catch (e) {
      setErrorMsg(formatDbSetupError(e));
    } finally {
      setSaving(false);
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

            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">Nutrition Intervention Required</p>
              <Select
                value={form.nutritionIntervention || "No"}
                onChange={(v) => setForm({ ...form, nutritionIntervention: v })}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Select>
            </div>

            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">Health Category</p>
              <Select value={form.healthCategory} onChange={(v) => setForm({ ...form, healthCategory: v })}>
                <option value="HEALTHY">HEALTHY</option>
                <option value="SPECIAL POPULATION">SPECIAL POPULATION</option>
              </Select>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 space-y-4">
              <div>
                <h4 className="text-base font-black">PAR-Q Screening</h4>
                <div className="mt-3 space-y-2">
                  {parqQuestions.map((q) => (
                    <div key={q} className="flex items-center justify-between rounded-2xl bg-white p-3 gap-3">
                      <p className="text-sm font-medium text-slate-700">{q}</p>
                      <Select value={parqAnswers[q] || "no"} onChange={(v) => setParqAnswers({ ...parqAnswers, [q]: v })}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-base font-black">Exercise History — FITT</h4>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {exerciseHistoryQuestions.map((item) => (
                    <div key={item.key}>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-400">{item.label}</p>
                      <Select
                        value={exerciseHistoryAnswers[item.key] || item.options[0]}
                        onChange={(v) => setExerciseHistoryAnswers({ ...exerciseHistoryAnswers, [item.key]: v })}
                      >
                        {item.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-base font-black">Lifestyle / Health History</h4>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {lifestyleQuestions.map((item) => (
                    <div key={item.key}>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-400">{item.label}</p>
                      <Select
                        value={lifestyleAnswers[item.key] || item.options[0]}
                        onChange={(v) => setLifestyleAnswers({ ...lifestyleAnswers, [item.key]: v })}
                      >
                        {item.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={saveMember}
                disabled={saving}
                className="flex-1 rounded-2xl bg-slate-950"
              >
                <Plus size={16} className="mr-2" />
                {saving ? "Saving…" : editingId ? "Update Member" : "Create Member"}
              </Button>
              {editingId && (
                <Button variant="outline" className="flex-1 rounded-2xl" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>

            {errorMsg && (
              <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            {infoMsg && !errorMsg && (
              <div className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-800">{infoMsg}</div>
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
                    <div className="flex items-center gap-2">
                      <Badge tone={m.phase === "UNCLASSIFIED" ? "unclassified" : m.phase.toLowerCase()}>
                        {m.phase}
                      </Badge>
                      <Button
                        variant="outline"
                        className="rounded-xl px-3 py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(m);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl px-3 py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMember(m.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
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

function MemberSignup({ setMembers, setSelectedMemberId, session }) {
  const [signup, setSignup] = useState({
    name: "",
    gender: "male",
    dob: "",
    age: "",
    address: "",
    phone: "",
    email: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    govtIdType: "Aadhar",
    govtIdNumber: "",
    govtIdFile: "",
  });
  const [govtIdFileObj, setGovtIdFileObj] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [createdMember, setCreatedMember] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  function isMissingColumnError(err) {
    const msg = err?.message || String(err || "");
    return msg.includes("does not exist") && msg.includes("column");
  }

  function formatDbSetupError(err) {
    const msg = err?.message || String(err || "");
    if (msg.includes("Could not find the table 'public.members'")) {
      return "Supabase DB not initialized: run supabase/schema.sql in Supabase SQL Editor, then go to Settings → API → Reload schema cache.";
    }
    return msg || "Database error";
  }

  async function submitSignup() {
    setErrorMsg("");
    setInfoMsg("");
    setSaved(false);
    setCreatedMember(null);

    if (!supabase || !session?.user?.id) {
      setErrorMsg("Not signed in, or Supabase not configured");
      return;
    }

    if (!signup.name.trim()) {
      setErrorMsg("Enter full name");
      return;
    }

    const phone = normalizePhoneE164(signup.phone);
    if (!phone) {
      setErrorMsg("Enter phone in E.164 format (e.g. +919876543210)");
      return;
    }

    setSaving(true);
    try {
      const memberCode = generateMemberCode();
      const calculatedAge = calculateAgeFromDOB(signup.dob);

      const basePayload = {
        coach_id: session.user.id,
        member_code: memberCode,
        full_name: normalizeFullName(signup.name),
        phone,
        gender: signup.gender,
        dob: signup.dob || null,
        age: Number(calculatedAge || signup.age || 0) || null,
        goal: "Pending coach allocation",
        readiness_trend: "Not started",
        phase: "UNCLASSIFIED",
        status: "Pending Assessment",
        renewal: null,
      };

      const extendedPayload = {
        address: signup.address,
        email: signup.email,
        emergency_contact_name: signup.emergencyContactName,
        emergency_contact_number: signup.emergencyContactNumber,
        govt_id_type: signup.govtIdType,
        govt_id_number: signup.govtIdNumber,
        govt_id_file: signup.govtIdFile,
      };

      let result = await supabase
        .from("members")
        .insert({ ...basePayload, ...extendedPayload })
        .select("*")
        .single();

      if (result.error && isMissingColumnError(result.error)) {
        result = await supabase.from("members").insert(basePayload).select("*").single();
        if (result.error) throw result.error;
        setInfoMsg("Signup saved. (Extra fields will persist after Supabase schema update.)");
      }

      if (result.error) throw result.error;

      let finalRow = result.data;

      if (govtIdFileObj) {
        const docId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
        const safeName = String(govtIdFileObj.name || "govt-id").replace(/\s+/g, "-");
        const docPath = `members/${finalRow.id}/${docId}-${safeName}`;
        const upload = await supabase.storage
          .from("member-docs")
          .upload(docPath, govtIdFileObj, {
            contentType: govtIdFileObj.type || undefined,
            upsert: true,
          });
        if (upload.error) throw upload.error;

        const { data: updated, error: updErr } = await supabase
          .from("members")
          .update({ govt_id_file: docPath })
          .eq("id", finalRow.id)
          .select("*")
          .single();
        if (updErr) throw updErr;
        finalRow = updated;
      }

      const uiMember = {
        ...mapMemberRow(finalRow),
        address: signup.address,
        email: signup.email,
        emergencyContactName: signup.emergencyContactName,
        emergencyContactNumber: signup.emergencyContactNumber,
        govtIdType: signup.govtIdType,
        govtIdNumber: signup.govtIdNumber,
        govtIdFile: finalRow.govt_id_file || signup.govtIdFile,
      };

      setMembers((prev) => [uiMember, ...prev]);
      setSelectedMemberId(String(uiMember.id));
      setCreatedMember({ memberCode, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      setSignup({
        name: "",
        gender: "male",
        dob: "",
        age: "",
        address: "",
        phone: "",
        email: "",
        emergencyContactName: "",
        emergencyContactNumber: "",
        govtIdType: "Aadhar",
        govtIdNumber: "",
        govtIdFile: "",
      });
      setGovtIdFileObj(null);
    } catch (e) {
      setErrorMsg(formatDbSetupError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SectionTitle
        icon={Users}
        title="Member Signup Page"
        subtitle="Client-facing signup information is captured here and saved into the coach/admin member list."
      />
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="space-y-5 p-6">
          {saved && (
            <Badge tone="performance">
              <CheckCircle2 size={14} className="mr-1" /> Signup Saved
            </Badge>
          )}

          {errorMsg && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{errorMsg}</div>
          )}

          {infoMsg && !errorMsg && (
            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">{infoMsg}</div>
          )}

          {createdMember && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-bold">Member created</p>
              <p className="mt-1">
                Member ID: <span className="font-black">{createdMember.memberCode}</span>
              </p>
              <p className="text-xs text-emerald-900/70">Member logs in with this ID + {createdMember.phone}.</p>
            </div>
          )}

          <div className="rounded-3xl bg-slate-50 p-5">
            <h3 className="mb-4 text-lg font-black">Basic Information</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Full name" value={signup.name} onChange={(e) => setSignup({ ...signup, name: e.target.value })} />
              <Input placeholder="Phone number (e.g. +919876543210)" value={signup.phone} onChange={(e) => setSignup({ ...signup, phone: e.target.value })} />
              <Input placeholder="Email address" type="email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
              <Input placeholder="Residential address" value={signup.address} onChange={(e) => setSignup({ ...signup, address: e.target.value })} />
              <Select value={signup.gender} onChange={(v) => setSignup({ ...signup, gender: v })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </Select>
              <Input
                type="date"
                value={signup.dob}
                onChange={(e) => setSignup({ ...signup, dob: e.target.value, age: calculateAgeFromDOB(e.target.value) })}
              />
              <Input placeholder="Age auto-calculated" value={signup.age} readOnly />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-5">
            <h3 className="mb-4 text-lg font-black">Emergency Contact</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Emergency Contact Name" value={signup.emergencyContactName} onChange={(e) => setSignup({ ...signup, emergencyContactName: e.target.value })} />
              <Input placeholder="Emergency Contact Number" value={signup.emergencyContactNumber} onChange={(e) => setSignup({ ...signup, emergencyContactNumber: e.target.value })} />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-5">
            <h3 className="mb-4 text-lg font-black">Government ID Proof</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={signup.govtIdType} onChange={(v) => setSignup({ ...signup, govtIdType: v })}>
                <option value="Aadhar">Aadhar</option>
                <option value="Passport">Passport</option>
                <option value="Other Govt ID">Other Govt ID</option>
              </Select>
              <Input placeholder="Government ID number" value={signup.govtIdNumber} onChange={(e) => setSignup({ ...signup, govtIdNumber: e.target.value })} />
            </div>
            <div className="mt-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Upload Govt ID proof</p>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const fileObj = e.target.files?.[0] || null;
                  setGovtIdFileObj(fileObj);
                  setSignup({ ...signup, govtIdFile: fileObj?.name || "" });
                }}
              />
              {signup.govtIdFile && <p className="mt-1 text-xs text-slate-500">Selected: {signup.govtIdFile}</p>}
            </div>
          </div>

          <Button onClick={submitSignup} disabled={saving} className="w-full rounded-2xl bg-slate-950">
            <Save size={16} className="mr-2" /> {saving ? "Saving…" : "Save Signup"}
          </Button>
        </CardContent>
      </Card>
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
            <Mini label="Phone" value={selectedMember.phone || "—"} />
            <Mini label="Email" value={selectedMember.email || "—"} />
            <Mini label="Address" value={selectedMember.address || "—"} />
            <Mini label="Govt ID" value={selectedMember.govtIdType ? `${selectedMember.govtIdType} submitted` : "—"} />
            <Mini label="Emergency Name" value={selectedMember.emergencyContactName || "—"} />
            <Mini label="Emergency Number" value={selectedMember.emergencyContactNumber || "—"} />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            These details are reflected from the coach/admin member form. Classification and assessment scores are updated from the Assessment Lab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Recovery({ selectedMember, setMembers }) {
  const isSpecialPopulation =
    selectedMember.goal === "Special Population" ||
    selectedMember.healthCategory === "SPECIAL POPULATION";

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
    ...(isSpecialPopulation
      ? [
          {
            label: "Resting Heart Rate",
            key: "restingHR",
            type: "metric",
            emoji: "❤️",
            principle: "Daily resting HR monitoring for special populations.",
          },
          {
            label: "Systolic Blood Pressure",
            key: "systolicBP",
            type: "metric",
            emoji: "🩺",
            principle: "Blood pressure screening for exercise safety.",
          },
          {
            label: "Diastolic Blood Pressure",
            key: "diastolicBP",
            type: "metric",
            emoji: "🩺",
            principle: "Blood pressure monitoring requirement.",
          },
        ]
      : []),
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
    restingHR: "",
    systolicBP: "",
    diastolicBP: "",
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
                        <span>{q.min} h</span>
                        <span className="text-lg font-black text-slate-950">
                          {data[q.key]} h
                        </span>
                        <span>{q.max} h</span>
                      </div>
                    </div>
                  )}

                  {q.type === "metric" && (
                    <Input
                      type="number"
                      placeholder={q.label}
                      value={data[q.key]}
                      onChange={(e) => setData({ ...data, [q.key]: e.target.value })}
                    />
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
            <SaveButton
              className="mt-5 w-full"
              onSave={async () => {
                if (!supabase || !selectedMember?.id) return;
                const scoreNow = readinessScore(data);
                const payload = {
                  member_id: selectedMember.id,
                  log_date: data.date,
                  score: scoreNow,
                  data,
                };
                const { error: logErr } = await supabase.from("readiness_logs").insert(payload);
                if (logErr) throw logErr;
                const { error: updErr } = await supabase
                  .from("members")
                  .update({ latest_readiness: scoreNow })
                  .eq("id", selectedMember.id);
                if (updErr) throw updErr;
                setMembers?.((prev) =>
                  prev.map((m) =>
                    String(m.id) === String(selectedMember.id)
                      ? { ...m, latestReadiness: scoreNow }
                      : m,
                  ),
                );
              }}
            >
              Save Daily Readiness
            </SaveButton>
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

function Assessments({ selectedMember, setMembers }) {
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
          <AssessmentFields
            active={active}
            selectedMember={selectedMember}
            setMembers={setMembers}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentFields({ active, selectedMember, setMembers }) {
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const sectionRef = useRef(null);
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(selectedMember.age || 30);
  const [cardioMethod, setCardioMethod] = useState("fox");
  const [selectedMobilityTest, setSelectedMobilityTest] = useState("Sit & Reach");
  const [selectedBalanceTest, setSelectedBalanceTest] = useState("Y Balance Test");

  const makeClassificationDataFromMember = (member) => ({
    deepSquat: 2,
    hurdleStep: 2,
    inlineLunge: 2,
    shoulderMobility: 2,
    activeStraightLegRaise: 2,
    trunkStabilityPushup: 2,
    rotaryStability: 2,
    pain: member?.pain === "Not assessed" ? 0 : member?.pain || 0,
    vo2Estimate:
      member?.vo2Estimate === "Not assessed"
        ? 35
        : member?.vo2Estimate || 35,
    movementQuality:
      member?.movementQuality === "Not assessed"
        ? "moderate"
        : member?.movementQuality || "moderate",
    trainingHistory:
      member?.trainingHistory === "Not assessed"
        ? "general_activity"
        : member?.trainingHistory || "general_activity",
  });

  const [classificationData, setClassificationData] = useState(() =>
    makeClassificationDataFromMember(selectedMember),
  );

  useEffect(() => {
    setAge(selectedMember?.age || 30);
    setClassificationData(makeClassificationDataFromMember(selectedMember));
  }, [selectedMember?.id]);

  function collectSectionValues(root) {
    if (!root) return {};
    const values = {};
    const fields = root.querySelectorAll("input, textarea, select");
    fields.forEach((el) => {
      if (el.tagName.toLowerCase() === "input" && el.type === "file") return;
      const key = el.name || el.getAttribute("placeholder") || el.id;
      if (!key) return;
      values[key] = el.value;
    });
    return values;
  }

  useEffect(() => {
    const savedSection = selectedMember?.assessmentLab?.[active];
    if (!savedSection) return;

    if (savedSection.gender) setGender(savedSection.gender);
    if (savedSection.age) setAge(savedSection.age);
    if (savedSection.cardioMethod) setCardioMethod(savedSection.cardioMethod);
    if (savedSection.selectedMobilityTest)
      setSelectedMobilityTest(savedSection.selectedMobilityTest);
    if (savedSection.selectedBalanceTest)
      setSelectedBalanceTest(savedSection.selectedBalanceTest);
    if (savedSection.classificationData)
      setClassificationData(savedSection.classificationData);

    const root = sectionRef.current;
    if (!root) return;
    requestAnimationFrame(() => {
      const fields = root.querySelectorAll("input, textarea, select");
      fields.forEach((el) => {
        if (el.tagName.toLowerCase() === "input" && el.type === "file") return;
        const key = el.name || el.getAttribute("placeholder") || el.id;
        if (!key) return;
        const nextValue = savedSection[key];
        if (nextValue === undefined || nextValue === null) return;
        el.value = String(nextValue);
      });
    });
  }, [active, selectedMember?.id]);

  async function saveSection() {
    setSaveError("");
    if (!supabase || !selectedMember?.id) return;

    const sectionValues = collectSectionValues(sectionRef.current);
    const sectionPayload = {
      savedAt: new Date().toISOString(),
      ...sectionValues,
      gender,
      age,
      cardioMethod,
      selectedMobilityTest,
      selectedBalanceTest,
    };

    if (active === "Classification") {
      sectionPayload.classificationData = classificationData;
      sectionPayload.fmsTotal = fmsTotal;
      sectionPayload.cardioCategory = cardioCategory;
      sectionPayload.calculatedPhase = calculatedPhase;
    }

    if (active === "Body Composition") {
      const jp = calculateJacksonPollock3Site({
        gender,
        age,
        chest: sectionValues["Chest skinfold in mm"],
        abdomen: sectionValues["Abdomen skinfold in mm"],
        thigh: sectionValues["Thigh skinfold in mm"],
        triceps: sectionValues["Triceps skinfold in mm"],
        suprailiac: sectionValues["Suprailiac skinfold in mm"],
      });
      if (jp) sectionPayload.jacksonPollock = jp;
    }

    const nextAssessmentLab = {
      ...(selectedMember.assessmentLab || {}),
      [active]: sectionPayload,
    };

    const updates = {
      assessment_lab: nextAssessmentLab,
    };

    // Keep member "headline" fields in sync for Classification only.
    if (active === "Classification") {
      updates.fms_total = fmsTotal;
      updates.pain_nprs = Number(classificationData.pain || 0);
      updates.vo2_estimate = Number(classificationData.vo2Estimate || 0);
      updates.movement_quality = classificationData.movementQuality;
      updates.training_history = classificationData.trainingHistory;
      updates.phase = calculatedPhase;
    }

    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", selectedMember.id)
      .select("*")
      .single();
    if (error) {
      setSaveError(error.message || String(error));
      throw error;
    }

    const mapped = mapMemberRow(data);
    setMembers?.((prev) => prev.map((m) => (String(m.id) === String(mapped.id) ? mapped : m)));
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
            {saveError && (
              <Badge tone="unclassified">Save failed</Badge>
            )}
            <Button onClick={saveSection} className="rounded-2xl bg-slate-950">
              <Save size={16} className="mr-2" /> Save {active}
            </Button>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{saveError}</div>
      )}

      <div ref={sectionRef}>
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
            <Select name="bodyComp.gender" value={gender} onChange={setGender}>
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
    </div>
  );
}

function Programming({ selectedMember, setMembers, session }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  async function savePlan() {
    setErrorMsg("");
    setInfoMsg("");
    if (!supabase) {
      setErrorMsg("Supabase not configured");
      return;
    }
    if (!session?.user?.id) {
      setErrorMsg("Not signed in");
      return;
    }
    if (!selectedMember?.id) {
      setErrorMsg("Select a member first");
      return;
    }
    if (!file) {
      setErrorMsg("Choose a PDF/Excel file first");
      return;
    }

    setSaving(true);
    try {
      const planId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
      const safeName = String(file.name || "plan").replace(/\s+/g, "-");
      const storagePath = `members/${selectedMember.id}/${planId}-${safeName}`;
      const upload = await supabase.storage
        .from("member-plans")
        .upload(storagePath, file, { contentType: file.type || undefined, upsert: true });
      if (upload.error) throw upload.error;

      const planRecord = {
        id: planId,
        name: file.name,
        type: file.type || "application/octet-stream",
        status: "Coach uploaded",
        storagePath,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      };

      const nextPlans = Array.isArray(selectedMember.plans) ? [...selectedMember.plans] : [];
      nextPlans.unshift(planRecord);

      const { data, error } = await supabase
        .from("members")
        .update({ plans: nextPlans, current_plan_id: planId })
        .eq("id", selectedMember.id)
        .select("*")
        .single();
      if (error) throw error;

      const mapped = mapMemberRow(data);
      setMembers?.((prev) => prev.map((m) => (String(m.id) === String(mapped.id) ? mapped : m)));
      setInfoMsg("Plan uploaded and linked to member.");
      setFile(null);
    } catch (e) {
      setErrorMsg(e?.message || String(e));
      throw e;
    } finally {
      setSaving(false);
    }
  }

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
            {errorMsg && (
              <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{errorMsg}</div>
            )}
            {infoMsg && !errorMsg && (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{infoMsg}</div>
            )}
            <div className="mt-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Upload className="mx-auto text-slate-400" />
              <p className="mt-3 font-bold">Upload PDF / Excel</p>
              <p className="text-sm text-slate-500">Program file saved to member profile.</p>
              <Input
                type="file"
                className="mt-4"
                accept=".pdf,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <SaveButton className="mt-4 w-full" onSave={savePlan}>
              {saving ? "Uploading…" : "Save Plan"}
            </SaveButton>
          </CardContent>
        </Card>
        <CalendarPlanner selectedMember={selectedMember} session={session} />
      </div>
    </div>
  );
}

function CalendarPlanner({ selectedMember, session }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [intensity, setIntensity] = useState("moderate");
  const [focus, setFocus] = useState("");
  const [rpeTarget, setRpeTarget] = useState("");

  async function saveSessionPlan() {
    if (!supabase || !session?.user?.id || !selectedMember?.id) return;
    const payload = {
      member_id: selectedMember.id,
      plan_date: date,
      intensity,
      focus,
      rpe_target: rpeTarget,
    };
    const { error } = await supabase.from("session_plans").insert(payload);
    if (error) throw error;
  }

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardContent className="p-5 space-y-3">
        <h3 className="text-lg font-black">Calendar Planning</h3>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select value={intensity} onChange={setIntensity}>
          <option value="easy">Easy Day</option>
          <option value="moderate">Moderate Day</option>
          <option value="hard">Hard Day</option>
        </Select>
        <Input
          placeholder="Session focus e.g. Lower Strength + Zone 2"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
        />
        <Input
          placeholder="RPE-based load target e.g. RPE 7"
          value={rpeTarget}
          onChange={(e) => setRpeTarget(e.target.value)}
        />
        <SaveButton className="w-full" onSave={saveSessionPlan}>
          Save Session Plan
        </SaveButton>
      </CardContent>
    </Card>
  );
}

function Training({ selectedMember }) {
  const planList = Array.isArray(selectedMember.plans) ? selectedMember.plans : [];
  const initialPlanId = selectedMember.currentPlanId || (planList[0] ? planList[0].id : "");
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [planPreviewUrl, setPlanPreviewUrl] = useState("");
  const [planPreviewLoading, setPlanPreviewLoading] = useState(false);

  const selectedPlan = planList.find((p) => String(p.id) === String(selectedPlanId)) || null;

  async function ensurePlanUrl(plan) {
    if (!supabase || !plan?.storagePath) return "";
    setPlanPreviewLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("member-plans")
        .createSignedUrl(plan.storagePath, 60 * 10);
      if (error) throw error;
      setPlanPreviewUrl(data.signedUrl);
      return data.signedUrl;
    } finally {
      setPlanPreviewLoading(false);
    }
  }

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

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:w-[360px]">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Select plan
              </p>
              <Select
                value={selectedPlanId}
                onChange={(v) => {
                  setSelectedPlanId(v);
                  setPlanPreviewUrl("");
                }}
              >
                {planList.length ? (
                  planList.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))
                ) : (
                  <option value="">No plan uploaded</option>
                )}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={async () => {
                  const next = !showPlanPreview;
                  setShowPlanPreview(next);
                  if (next && selectedPlan && !planPreviewUrl) {
                    await ensurePlanUrl(selectedPlan);
                  }
                }}
                disabled={!selectedPlan}
              >
                {showPlanPreview ? "Hide Plan" : "Preview Plan"}
              </Button>
              <Button
                className="rounded-2xl bg-slate-950"
                onClick={async () => {
                  if (!selectedPlan) return;
                  await downloadPlanFile(selectedMember, selectedPlan);
                }}
                disabled={!selectedPlan}
              >
                <FileSpreadsheet size={16} className="mr-2" /> Download Plan
              </Button>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-700">
              {selectedPlan?.name || "Coach Plan"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {selectedPlan
                ? `${selectedPlan.type || "PDF / Excel"} • ${selectedPlan.status || "Coach uploaded"}`
                : "PDF/Excel plan uploaded by coach will appear here for the member to view before logging the workout."}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Mini label="Today" value="Lower Strength" />
              <Mini label="Intensity" value="RPE 7" />
              <Mini label="Status" value="Pending" />
            </div>

            {showPlanPreview && selectedPlan && (
              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Plan Preview
                </p>
                {planPreviewLoading && (
                  <p className="mt-2 text-sm text-slate-500">Loading preview…</p>
                )}
                {!planPreviewLoading && planPreviewUrl && String(selectedPlan.type || "").includes("pdf") && (
                  <iframe
                    title="Plan preview"
                    src={planPreviewUrl}
                    className="mt-3 h-[520px] w-full rounded-2xl border border-slate-200"
                  />
                )}
                {!planPreviewLoading && (!planPreviewUrl || !String(selectedPlan.type || "").includes("pdf")) && (
                  <div className="mt-2 text-sm text-slate-600">
                    Preview is supported for PDF plans. Use “Download Plan” for Excel.
                  </div>
                )}
              </div>
            )}
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
            <SaveButton
              onSave={async () => {
                if (!supabase || !selectedMember?.id) return;
                const payload = {
                  member_id: selectedMember.id,
                  performed_at: new Date().toISOString().slice(0, 10),
                  rows,
                  total_volume: total,
                };
                const { error } = await supabase.from("workout_logs").insert(payload);
                if (error) throw error;
              }}
            >
              Save Workout
            </SaveButton>
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
        <MetricCard
          label="Readiness"
          value={
            selectedMember?.latestReadiness !== null &&
            selectedMember?.latestReadiness !== undefined
              ? String(selectedMember.latestReadiness)
              : "—"
          }
          icon={Droplets}
        />
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

function Reports({ members, session }) {
  const emailRef = useRef(null);
  const whatsappRef = useRef(null);

  function buildReportPayload() {
    return {
      generated_at: new Date().toISOString(),
      members: (members || []).map((m) => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        goal: m.goal,
        phase: m.phase,
        status: m.status,
        renewal: m.renewal,
        latestReadiness: m.latestReadiness ?? null,
        fmsTotal: m.fmsTotal ?? null,
        pain: m.pain ?? null,
        vo2Estimate: m.vo2Estimate ?? null,
      })),
    };
  }

  async function logReportExport(format) {
    if (!supabase || !session?.user?.id) return buildReportPayload();
    const payload = buildReportPayload();
    const { error } = await supabase
      .from("report_exports")
      .insert({ coach_id: session.user.id, format, payload });
    if (error) throw error;
    return payload;
  }

  async function logReportSend(channel) {
    if (!supabase || !session?.user?.id) return;
    const recipient =
      channel === "email" ? emailRef.current?.value : whatsappRef.current?.value;
    const payload = buildReportPayload();
    const { error } = await supabase
      .from("report_sends")
      .insert({ coach_id: session.user.id, channel, recipient, payload });
    if (error) throw error;
  }

  function downloadCSV(filename, rows) {
    const escape = (v) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [
      [
        "Name",
        "Phone",
        "Goal",
        "Phase",
        "Status",
        "Renewal",
        "Latest Readiness",
        "FMS Total",
        "Pain",
        "VO2 Estimate",
      ].join(","),
      ...rows.map((r) =>
        [
          r.name,
          r.phone,
          r.goal,
          r.phase,
          r.status,
          r.renewal,
          r.latestReadiness,
          r.fmsTotal,
          r.pain,
          r.vo2Estimate,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printReport(payload) {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = payload?.members || [];
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Fitness LAB OS Report</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px; }
            p { margin: 0 0 16px; color: #444; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Fitness LAB OS — Report</h1>
          <p>Generated at: ${payload.generated_at}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Goal</th><th>Phase</th><th>Status</th><th>Renewal</th><th>Latest Readiness</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) =>
                    `<tr><td>${r.name ?? ""}</td><td>${r.phone ?? ""}</td><td>${r.goal ?? ""}</td><td>${r.phase ?? ""}</td><td>${r.status ?? ""}</td><td>${r.renewal ?? ""}</td><td>${r.latestReadiness ?? ""}</td></tr>`,
                )
                .join("\n")}
            </tbody>
          </table>
        </body>
      </html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

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
              <Button
                className="rounded-2xl bg-slate-950"
                onClick={() => {
                  void (async () => {
                    try {
                      await logReportExport("save");
                    } catch (e) {
                      console.error(e);
                    }
                  })();
                }}
              >
                <Save size={16} className="mr-2" /> Save Report
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-slate-300"
                onClick={() => {
                  void (async () => {
                    try {
                      const payload = await logReportExport("csv");
                      const date = payload.generated_at.slice(0, 10);
                      downloadCSV(`fitness-lab-report-${date}.csv`, payload.members);
                    } catch (e) {
                      console.error(e);
                    }
                  })();
                }}
              >
                <FileSpreadsheet size={16} className="mr-2" /> Download Excel
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-slate-300"
                onClick={() => {
                  void (async () => {
                    try {
                      const payload = await logReportExport("pdf_print");
                      printReport(payload);
                    } catch (e) {
                      console.error(e);
                    }
                  })();
                }}
              >
                <ClipboardList size={16} className="mr-2" /> Download PDF
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-slate-300"
                onClick={() => {
                  void (async () => {
                    try {
                      await logReportExport("generate");
                    } catch (e) {
                      console.error(e);
                    }
                  })();
                }}
              >
                <Upload size={16} className="mr-2" /> Generate Report
              </Button>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <h4 className="font-black">Send Report</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Button
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    void (async () => {
                      try {
                        await logReportSend("whatsapp");
                      } catch (e) {
                        console.error(e);
                      }
                    })();
                  }}
                >
                  Send via WhatsApp
                </Button>
                <Button
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    void (async () => {
                      try {
                        await logReportSend("email");
                      } catch (e) {
                        console.error(e);
                      }
                    })();
                  }}
                >
                  Send via Email
                </Button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input ref={emailRef} placeholder="Client email address" />
                <Input ref={whatsappRef} placeholder="Client WhatsApp number" />
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

function Admin({ members, session }) {
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
                <SaveButton
                  className="bg-slate-950"
                  onSave={async () => {
                    if (!supabase || !session?.user?.id) return;
                    const { error } = await supabase.from("billing_updates").insert({
                      member_id: m.id,
                      payload: {
                        status: m.status,
                        renewal: m.renewal,
                        action: "update_billing",
                        at: new Date().toISOString(),
                      },
                    });
                    if (error) throw error;
                  }}
                >
                  Update Billing
                </SaveButton>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
