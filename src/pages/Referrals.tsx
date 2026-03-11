import { motion } from "framer-motion";
import { Gift, Rocket, Sparkles, Stars, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

import LiquidBackground from "@/components/LiquidBackground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const cashOffers = [
  {
    title: "1 friend joins",
    description: "Preview a first cash bonus tier for your first successful invite.",
    icon: Sparkles,
  },
  {
    title: "3 friends join",
    description: "Step into a bigger cash payout once more friends sign up with your invite.",
    icon: Gift,
  },
  {
    title: "Campus ambassador",
    description: "Push for larger cash campaigns, leaderboard status, and featured creator energy.",
    icon: Trophy,
  },
];

const launchSteps = [
  "Personal referral links for every student account",
  "Cash tracking with clean progress snapshots",
  "Invite milestones and limited-run payout campaigns",
];

const Referrals = () => {
  return (
    <div className="liquid-bg min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <LiquidBackground />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative isolate overflow-hidden rounded-[2rem] border border-white/50 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_120px_-40px_rgba(15,23,42,0.85)] sm:px-8 md:px-10 md:py-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.26),_transparent_34%),radial-gradient(circle_at_80%_18%,_rgba(59,130,246,0.32),_transparent_26%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(12,74,110,0.92)_48%,_rgba(8,47,73,0.96))]" />
          <div className="absolute -left-10 top-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <Badge className="mb-4 border-white/15 bg-white/10 px-4 py-1 text-white backdrop-blur-sm hover:bg-white/10">
                Referral Program | Coming Soon
              </Badge>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                Invite your study crew and get real cash.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-200 md:text-lg">
                We are building a referral experience that feels worth sharing: instant invite links,
                cash milestones, and a leaderboard energy that pushes the whole class forward.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button disabled className="rounded-full bg-white px-6 text-slate-950 hover:bg-white">
                  <Rocket className="mr-2 h-4 w-4" />
                  Launching Soon
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">Cash</p>
                  <p className="mt-2 text-2xl font-semibold">Real payouts</p>
                  <p className="mt-1 text-sm text-slate-200">Earn more cash as more friends join.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">Sharing</p>
                  <p className="mt-2 text-2xl font-semibold">1 tap</p>
                  <p className="mt-1 text-sm text-slate-200">Fast link copy and social-ready prompts.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">Status</p>
                  <p className="mt-2 text-2xl font-semibold">Preview</p>
                  <p className="mt-1 text-sm text-slate-200">UI is live now. Cash payout system comes next.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-cyan-300/10 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                <div className="rounded-[1.5rem] border border-white/15 bg-slate-950/55 p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300">Your future referral code</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[0.2em] text-cyan-100">
                        NOTE-BUDDY
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/15">
                      <Users className="h-7 w-7 text-cyan-100" />
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-300">Referral link</p>
                        <p className="mt-1 truncate text-sm text-white/90">
                          noteexplainer.app/invite/coming-soon
                        </p>
                      </div>
                      <Badge className="shrink-0 border-cyan-200/20 bg-cyan-300/15 text-cyan-50 hover:bg-cyan-300/15">
                        Locked
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span className="text-sm text-slate-300">Invites sent</span>
                      <span className="text-lg font-semibold">00</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span className="text-sm text-slate-300">Friends joined</span>
                      <span className="text-lg font-semibold">00</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span className="text-sm text-slate-300">Cash tier</span>
                      <span className="text-lg font-semibold">Coming Soon</span>
                    </div>
                  </div>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 opacity-60" />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                    Preview progress UI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="liquid-card rounded-[1.75rem] p-6 md:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                  Cash preview
                </p>
                <h2 className="mt-2 text-3xl font-bold text-foreground">What inviting friends could pay</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
                <Stars className="h-6 w-6" />
              </div>
            </div>

            <div className="grid gap-4">
              {cashOffers.map((reward, index) => (
                <motion.div
                  key={reward.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.08, duration: 0.4 }}
                  className="group rounded-[1.5rem] border border-border/70 bg-white/65 p-5 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.5)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      <reward.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{reward.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{reward.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.45 }}
            className="space-y-6"
          >
            <div className="liquid-card rounded-[1.75rem] p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">Launch board</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">What is coming next</h2>
              <div className="mt-6 space-y-4">
                {launchSteps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl bg-white/60 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-primary via-sky-800 to-secondary p-6 text-white shadow-[0_24px_70px_-30px_rgba(14,116,144,0.8)] md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100/90">Coming soon</p>
              <h2 className="mt-2 text-3xl font-bold">Built to feel viral, not generic.</h2>
              <p className="mt-3 text-sm leading-6 text-cyan-50/90">
                This page is intentionally live first so the referral program already has a home in the
                product. Once the backend is ready, this UI can plug into real invite counts, links, and
                cash payouts without redesigning the flow.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Referrals;
