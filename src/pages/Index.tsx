import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiquidBackground from "@/components/LiquidBackground";
import heroImage from "@/assets/hero-liquid.png";
import PwaInstallButton from "@/components/PwaInstallButton";

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

const Index = () => {
  return (
    <div className="liquid-bg min-h-screen">
      <LiquidBackground />

      {/* Hero */}
      <section className="relative z-10 pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="liquid-card p-8 md:p-12 lg:p-16 overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-body font-semibold bg-secondary/15 text-secondary mb-6">
                  One Workspace For Notes + AI
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                  The Premium{" "}
                  <span className="liquid-text-gradient">Study OS</span>{" "}
                  For Modern Classrooms
                </h1>
                <p className="text-lg text-muted-foreground font-body mb-8 max-w-lg">
                  Capture lessons, generate AI explanations, and review with quizzes — all in one beautifully designed workspace.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/register">
                    <Button className="h-12 px-8 rounded-xl font-body font-semibold text-base liquid-hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity">
                      Start Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" className="h-12 px-8 rounded-xl font-body font-semibold text-base border-border hover:bg-accent">
                      Log In
                    </Button>
                  </Link>
                  <PwaInstallButton />
                </div>
              </div>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img src={heroImage} alt="Note Explainer liquid design hero" className="w-full h-auto" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-secondary/20 animate-liquid-wave" />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-accent/50"
                >
                  <div className="w-10 h-10 rounded-xl liquid-accent-gradient flex items-center justify-center shrink-0">
                    <m.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-body font-bold text-foreground">{m.value}</p>
                    <p className="text-xs text-muted-foreground font-body">{m.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Band */}
      <section className="relative z-10 px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto liquid-card p-6 text-center"
        >
          <p className="text-sm font-body font-semibold text-secondary mb-4">Built For Consistent Daily Learning</p>
          <div className="flex flex-wrap justify-center gap-3">
            {bands.map((b) => (
              <span key={b} className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-body font-medium">
                {b}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-4 mb-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="liquid-card p-8 md:p-12"
          >
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">Why Students Choose Note Explainer</h2>
            <p className="text-muted-foreground font-body mb-10">
              Designed for day-to-day class use with a workflow that stays simple, fast, and reliable.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-accent/40 hover:bg-accent/70 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl liquid-accent-gradient flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-muted-foreground font-body">
            Ready to start?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create your account</Link>
            {" "}or{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">log in</Link>
            {" "}to continue.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
