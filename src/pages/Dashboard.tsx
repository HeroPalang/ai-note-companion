import { motion } from "framer-motion";
import { BookOpen, Brain, Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import LiquidBackground from "@/components/LiquidBackground";

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
];

const features = [
  "Upload or type notes",
  "Save notes to your account",
  "Generate AI explanations from your notes",
  "Create AI quiz questions for quick review",
];

const Dashboard = () => {
  return (
    <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
      <LiquidBackground />
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            Student Dashboard
          </h1>
          <p className="text-lg text-muted-foreground font-body">
            Your learning hub for notes and study materials
          </p>
        </motion.div>

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-card p-6 md:p-8 mb-8"
        >
          <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            What this app does
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-muted-foreground font-body">
                <span className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Link to={card.to} className="block group">
                <div className="liquid-card p-6 h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground font-body flex-1">{card.description}</p>
                  <span className="mt-4 text-sm font-body font-semibold text-primary group-hover:underline">
                    Open →
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
