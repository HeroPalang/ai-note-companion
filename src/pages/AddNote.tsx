import { useState } from "react";
import { motion } from "framer-motion";
import { Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LiquidBackground from "@/components/LiquidBackground";
import { createNote, getNotesSyncStatus, warmOfflineReadiness } from "@/lib/supabase";

const AddNote = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const messageFromError = (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createNote({
        title: title.trim() || "Untitled Note",
        content: content.trim(),
        subject: subject.trim() || null,
      });

      const { online, pending } = await getNotesSyncStatus();
      if (online && pending === 0) {
        toast.success("Note saved successfully.");
      } else {
        toast.success(`Note saved locally. Pending sync: ${pending}.`);
      }
      warmOfflineReadiness().catch(() => {
        // best-effort background warmup
      });
      navigate("/notes");
    } catch (error: unknown) {
      const rawMessage = messageFromError(error);
      if (String(rawMessage).toLowerCase().includes("not authenticated")) {
        toast.error("Session not available. Go online and log in again.");
      } else {
        toast.error(`Failed to save note: ${rawMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
      <LiquidBackground />
      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Add New Note</h1>
          <p className="text-muted-foreground font-body mb-8">Capture your lessons and study materials</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-card p-6 md:p-8 space-y-5"
        >
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">Title</label>
            <Input
              placeholder="e.g. Photosynthesis Process"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-xl font-body bg-accent/50"
              required
            />
          </div>
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">Subject</label>
            <Input
              placeholder="e.g. Biology, Math, History"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-12 rounded-xl font-body bg-accent/50"
            />
          </div>
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">Content</label>
            <Textarea
              placeholder="Type or paste your note content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] rounded-xl font-body bg-accent/50 resize-y"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-body font-semibold text-base liquid-hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Note"}
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default AddNote;
