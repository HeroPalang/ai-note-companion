import { motion } from "framer-motion";
import { BookOpen, Users, Zap, Shield } from "lucide-react";
import LiquidBackground from "@/components/LiquidBackground";

const values = [
  { icon: Zap, title: "Fast & Focused", description: "Built for speed so students spend less time on tools and more time learning." },
  { icon: Shield, title: "Secure & Private", description: "Your notes and data are protected with enterprise-grade security policies." },
  { icon: Users, title: "Student-First", description: "Every feature is designed with real classroom needs in mind." },
  { icon: BookOpen, title: "AI-Powered Learning", description: "Leverage AI to transform raw notes into structured study materials." },
];

const About = () => (
  <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
    <LiquidBackground />
    <div className="relative z-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">About Note Explainer</h1>
        <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
          Note Explainer is a premium study OS designed for modern classrooms. From raw notes to exam-ready confidence with one focused workflow.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="liquid-card p-6 md:p-10 mb-10"
      >
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">Our Mission</h2>
        <p className="text-muted-foreground font-body leading-relaxed">
          We believe every student deserves access to powerful, intuitive study tools. Note Explainer combines smart note management with AI-powered explanations and quiz generation to create a seamless learning experience. Whether you're reviewing for a test or organizing lecture notes, our platform helps you move from passive reading to active understanding.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="liquid-card p-6 flex gap-4"
          >
            <div className="w-11 h-11 rounded-2xl liquid-accent-gradient flex items-center justify-center shrink-0">
              <v.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground mb-1">{v.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{v.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-12"
      >
        <p className="text-sm text-muted-foreground font-body">
          Built by Hero Joy C. Palang · &copy; 2026 Note Explainer
        </p>
      </motion.div>
    </div>
  </div>
);

export default About;
