import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Trash2, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LiquidBackground from "@/components/LiquidBackground";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  createdAt: string;
}

const mockNotes: Note[] = [
  { id: "1", title: "Photosynthesis Process", content: "Photosynthesis is the process by which plants convert light energy into chemical energy...", subject: "Biology", createdAt: "2026-03-05" },
  { id: "2", title: "Quadratic Formula", content: "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a, used to solve equations of the form ax² + bx + c = 0...", subject: "Math", createdAt: "2026-03-04" },
  { id: "3", title: "World War II Timeline", content: "Key events: 1939 - Germany invades Poland. 1941 - Pearl Harbor attack...", subject: "History", createdAt: "2026-03-03" },
];

const Notes = () => {
  const [notes, setNotes] = useState(mockNotes);
  const [search, setSearch] = useState("");

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase())
  );

  const deleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
      <LiquidBackground />
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Saved Notes</h1>
          <p className="text-muted-foreground font-body mb-8">View and manage all your study notes</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-xl font-body bg-card/80 backdrop-blur border-border"
          />
        </motion.div>

        {/* Notes grid */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="liquid-card p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-body">No notes found. Start by adding some!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="liquid-card p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-semibold bg-secondary/15 text-secondary mb-2">
                      {note.subject}
                    </span>
                    <h3 className="font-display font-bold text-foreground">{note.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNote(note.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground font-body line-clamp-3 flex-1">{note.content}</p>
                <p className="text-xs text-muted-foreground/60 font-body mt-3">{note.createdAt}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
