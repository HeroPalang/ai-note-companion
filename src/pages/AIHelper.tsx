import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, BookCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LiquidBackground from "@/components/LiquidBackground";

const AIHelper = () => {
  const [noteContent, setNoteContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [quiz, setQuiz] = useState<string[]>([]);

  const generate = async () => {
    if (!noteContent.trim()) return;
    setLoading(true);
    // Simulate AI generation
    await new Promise((r) => setTimeout(r, 2000));
    setExplanation(
      `This note covers important concepts about "${noteContent.slice(0, 40)}..."\n\nKey Points:\n• The main idea focuses on understanding core principles\n• Several supporting details reinforce the central theme\n• Practical applications can be found in everyday scenarios\n\nThis topic is fundamental for building deeper understanding in this subject area.`
    );
    setQuiz([
      "What is the main concept discussed in these notes?",
      "How does this concept apply in real-world scenarios?",
      "What are the key supporting details mentioned?",
      "Can you explain the relationship between the main ideas?",
    ]);
    setLoading(false);
  };

  return (
    <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
      <LiquidBackground />
      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl liquid-hero-gradient flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground">AI Study Helper</h1>
          </div>
          <p className="text-muted-foreground font-body mb-8">
            Paste your notes and get AI-generated explanations and quiz questions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-card p-6 md:p-8 mb-6"
        >
          <label className="text-sm font-body font-semibold text-foreground mb-2 block">Your Note Content</label>
          <Textarea
            placeholder="Paste or type your note content here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[150px] rounded-xl font-body bg-accent/50 resize-y mb-4"
          />
          <Button
            onClick={generate}
            disabled={loading || !noteContent.trim()}
            className="w-full h-12 rounded-xl font-body font-semibold text-base liquid-hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Explanation & Quiz
              </>
            )}
          </Button>
        </motion.div>

        <AnimatePresence>
          {explanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Explanation */}
              <div className="liquid-card p-6 md:p-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  AI Explanation
                </h2>
                <p className="text-muted-foreground font-body whitespace-pre-line leading-relaxed">{explanation}</p>
              </div>

              {/* Quiz */}
              <div className="liquid-card p-6 md:p-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookCheck className="w-5 h-5 text-secondary" />
                  Quiz Questions
                </h2>
                <ol className="space-y-3">
                  {quiz.map((q, i) => (
                    <li key={i} className="flex gap-3 text-muted-foreground font-body">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm">
                        {i + 1}
                      </span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIHelper;
