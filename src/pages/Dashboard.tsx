import { motion } from "framer-motion";
import { BookOpen, Brain, FileText, Gift, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import LiquidBackground from "@/components/LiquidBackground";
import { useAuth } from "@/context/AuthContext";
import { getAiTokenUsageStatus, getNotesSyncStatus } from "@/lib/supabase";

const cards = [
  {
    title: "Add Notes",
    description: "Create new notes from your lessons, lectures, or study materials.",
    icon: Plus,
    to: "/add-note",
    color: "from-primary to-secondary",
  },
  {
    title: "Saved Notes",
    description: "Browse, search, and manage all your saved study notes.",
    icon: FileText,
    to: "/notes",
    color: "from-secondary to-primary",
  },
  {
    title: "AI Study Helper",
    description: "Generate AI explanations and quizzes from your notes.",
    icon: Brain,
    to: "/ai-helper",
    color: "from-primary to-secondary",
  },
  {
    title: "Referral Program",
    description: "An invite-and-earn-cash page is live in preview mode. Real cash details are coming soon.",
    icon: Gift,
    to: "/referrals",
    color: "from-secondary via-sky-500 to-primary",
    badge: "Coming Soon",
  },
];

const features = [
  "Upload or type notes",
  "Save notes to your account",
  "Generate AI explanations from your notes",
  "Create AI quiz questions for quick review",
];

const Dashboard = () => {
  const { user } = useAuth();
  const [syncLabel, setSyncLabel] = useState("Checking...");
  const [usageLabel, setUsageLabel] = useState("Checking...");

  useEffect(() => {
    const refresh = async () => {
      const sync = await getNotesSyncStatus().catch(() => ({ pending: 0 }));
      if ((sync?.pending || 0) > 0) {
        setSyncLabel(`Pending sync: ${sync.pending}`);
      } else {
        setSyncLabel("All notes synced");
      }

      const usage = await getAiTokenUsageStatus(24, 50_000).catch(() => null);
      if (!usage || !usage.limit) {
        setUsageLabel("Usage unavailable");
      } else {
        setUsageLabel(`${Number(usage.used || 0).toLocaleString()} / ${Number(usage.limit || 0).toLocaleString()} tokens`);
      }
    };

    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="liquid-bg min-h-screen px-4 pb-12 pt-24">
      <LiquidBackground />
      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="mb-3 text-4xl font-display font-bold text-foreground md:text-5xl">
            Student Dashboard
          </h1>
          <p className="font-body text-lg text-muted-foreground">
            Your learning hub for notes and study materials
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm text-muted-foreground">
            <span className="max-w-[200px] truncate sm:max-w-none">{user?.email || "student"}</span>
            <span className="hidden sm:inline">|</span>
            <span>{syncLabel}</span>
            <span className="hidden sm:inline">|</span>
            <span>{usageLabel}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-card mb-8 p-6 md:p-8"
        >
          <h2 className="mb-4 flex items-center gap-2 text-xl font-display font-bold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            What this app does
          </h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 font-body text-muted-foreground">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link to={card.to} className="group block h-full">
                <div className="liquid-card flex h-full flex-col p-6">
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} transition-transform group-hover:scale-110`}
                  >
                    <card.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-display font-bold text-foreground">{card.title}</h3>
                  {"badge" in card ? (
                    <span className="mb-3 inline-flex w-fit rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                      {card.badge}
                    </span>
                  ) : null}
                  <p className="flex-1 font-body text-sm text-muted-foreground">{card.description}</p>
                  <span className="mt-4 font-body text-sm font-semibold text-primary group-hover:underline">
                    {"Open ->"}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
