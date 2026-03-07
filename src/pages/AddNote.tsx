import { useState } from "react";
import { motion } from "framer-motion";
import { Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LiquidBackground from "@/components/LiquidBackground";

const AddNote = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Note saved successfully!");
    navigate("/notes");
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
          <Button type="submit" className="w-full h-12 rounded-xl font-body font-semibold text-base liquid-hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4 mr-2" />
            Save Note
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default AddNote;
