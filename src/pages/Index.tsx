import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Gift, Smartphone, Sparkles, Users, Zap } from "lucide-react";

import heroImage from "@/assets/hero-liquid.png";
import LiquidBackground from "@/components/LiquidBackground";
import PwaInstallButton from "@/components/PwaInstallButton";
import { Button } from "@/components/ui/button";

const metrics = [
  { value: "Fast", label: "Create and save notes instantly", icon: Zap },
  { value: "Focused", label: "AI explanation per selected note", icon: Brain },
  { value: "Practical", label: "Generate quizzes for revision", icon: BookOpen },
];

const features = [
  {
    icon: BookOpen,
    title: "Structured Note Management",
    description: "Create, organize, and revisit notes by subject so lessons are easier to track over time.",
  },
  {
    icon: Brain,
    title: "AI Support That Saves Time",
    description: "Turn long note content into clear explanations and quiz-ready review questions in seconds.",
  },
  {
    icon: Smartphone,
    title: "Ready Across Devices",
    description: "Use the same learning workspace on desktop and mobile with a beautiful responsive design.",
  },
];

const bands = ["Smart Note Storage", "AI Explanation Engine", "Quiz Generation", "Modern UI"];

const referralHighlights = [
  {
    icon: Users,
    title: "Invite your circle",
    description: "A dedicated referral space is now part of the product experience.",
  },
  {
    icon: Sparkles,
    title: "Preview the vibe",
    description: "Catch the visual concept now while cash tracking and payouts are still being built.",
  },
  {
    icon: Gift,
    title: "Real cash coming soon",
    description: "Invite links, cash milestones, and payout flow are planned for the next phase.",
  },
];

const Index = () => {
  return (
    <div className="liquid-bg min-h-screen">
      <LiquidBackground />

      <section className="relative z-10 px-4 pb-16 pt-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="liquid-card overflow-hidden p-6 sm:p-8 md:p-12 lg:p-16"
          >
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
              <div>
                <span className="mb-6 inline-block rounded-full bg-secondary/15 px-4 py-1.5 text-xs font-body font-semibold text-secondary">
                  One Workspace For Notes + AI
                </span>
                <h1 className="mb-6 text-3xl font-display font-bold leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                  The Premium <span className="liquid-text-gradient">Study OS</span> For Modern Classrooms
                </h1>
                <p className="mb-8 max-w-lg font-body text-base text-muted-foreground sm:text-lg">
                  Capture lessons, generate AI explanations, and review with quizzes all in one beautifully
                  designed workspace.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button className="h-12 w-full rounded-xl border-0 px-8 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto liquid-hero-gradient">
                      Start Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-xl border-border px-8 text-base font-semibold hover:bg-accent sm:w-auto"
                    >
                      Log In
                    </Button>
                  </Link>
                  <div className="w-full sm:w-auto">
                    <PwaInstallButton />
                  </div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img src={heroImage} alt="Note Explainer liquid design hero" className="h-auto w-full" />
                </div>
                <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-secondary/20 sm:-bottom-4 sm:-right-4 sm:h-24 sm:w-24" />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4 rounded-xl bg-accent/50 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl liquid-accent-gradient">
                    <metric.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-body font-bold text-foreground">{metric.value}</p>
                    <p className="font-body text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl liquid-card p-6 text-center"
        >
          <p className="mb-4 text-sm font-body font-semibold text-secondary">Built For Consistent Daily Learning</p>
          <div className="flex flex-wrap justify-center gap-3">
            {bands.map((band) => (
              <span key={band} className="rounded-full bg-accent px-4 py-2 text-sm font-body font-medium text-accent-foreground">
                {band}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mb-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/50 bg-slate-950 px-6 py-7 text-white shadow-[0_28px_90px_-42px_rgba(15,23,42,0.9)] sm:px-8 md:px-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/90">
                Referral Program
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-display font-bold leading-tight sm:text-4xl">
                Invite friends and get real cash. The payout engine is warming up.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                The referral preview is now live with a high-energy look and a dedicated page. Real invite
                links and cash payouts are still marked coming soon, but the experience already has a home.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/referrals" className="w-full sm:w-auto">
                  <Button className="h-12 w-full rounded-full bg-white px-6 text-slate-950 hover:bg-white sm:w-auto">
                    View Referral Preview
                  </Button>
                </Link>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {referralHighlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mb-16 px-4">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="liquid-card p-6 sm:p-8 md:p-12"
          >
            <h2 className="mb-2 text-3xl font-display font-bold text-foreground">
              Why Students Choose Note Explainer
            </h2>
            <p className="mb-10 font-body text-muted-foreground">
              Designed for day-to-day class use with a workflow that stays simple, fast, and reliable.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl bg-accent/40 p-6 transition-colors hover:bg-accent/70"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl liquid-accent-gradient">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-2 font-display font-bold text-foreground">{feature.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="font-body text-muted-foreground">
            Ready to start? <Link to="/register" className="font-semibold text-primary hover:underline">Create your account</Link>{" "}
            or <Link to="/login" className="font-semibold text-primary hover:underline">log in</Link> to continue.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
