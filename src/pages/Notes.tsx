import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LiquidBackground from "@/components/LiquidBackground";
import { toast } from "sonner";
import { deleteNote, getNotes, supabase } from "@/lib/supabase";
import FileViewer from "@/components/FileViewer";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string | null;
  explanation?: string | null;
  file_url?: string | null;
  created_at: string;
  _local?: boolean;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const messageFromError = (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error";

  const loadNotes = async () => {
    try {
      const rows = await getNotes();
      setNotes(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Failed to load notes:", error);
      toast.error("Could not load notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();

    const onFocus = () => {
      void loadNotes();
    };

    window.addEventListener("focus", onFocus);

    let activeChannel: { unsubscribe: () => void } | null = null;
    const setupRealtime = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (!userId) return;

      activeChannel = supabase
        .channel(`public:notes:user=${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${userId}` }, () => {
          void loadNotes();
        })
        .subscribe();
    };

    void setupRealtime();

    return () => {
      if (activeChannel) activeChannel.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      String(n.subject || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(id)));
      if (String(activeNote?.id) === String(id)) {
        setActiveNote(null);
      }
      toast.success("Note deleted.");
    } catch (error: unknown) {
      console.error("Delete failed:", error);
      const text = messageFromError(error);
      toast.error(text ? `Delete failed: ${text}` : "Delete failed.");
    }
  };

  return (
    <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
      <LiquidBackground />
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Saved Notes</h1>
          <p className="text-muted-foreground font-body mb-8">View and manage all your study notes</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-xl font-body bg-card/80 backdrop-blur border-border"
          />
        </motion.div>

        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="liquid-card p-12 text-center">
            <p className="text-muted-foreground font-body">Loading notes...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
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
                className="liquid-card p-5 flex flex-col cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => setActiveNote(note)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveNote(note);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-semibold bg-secondary/15 text-secondary">
                        {note.subject || "General"}
                      </span>
                      {note._local ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-semibold bg-primary/15 text-primary">
                          Local (pending sync)
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-display font-bold text-foreground">{note.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteNote(note.id);
                    }}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground font-body line-clamp-3 flex-1">{note.content}</p>
                {note.file_url ? (
                  <span className="text-xs font-body text-primary mt-2 inline-block">📎 Has attachment</span>
                ) : null}
                {note.explanation ? (
                  <p className="text-xs text-muted-foreground/80 font-body mt-2 line-clamp-2">AI: {note.explanation}</p>
                ) : null}
                <p className="text-xs text-muted-foreground/60 font-body mt-3">{new Date(note.created_at).toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(activeNote)} onOpenChange={(open) => !open && setActiveNote(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl p-0">
          {activeNote ? (
            <>
              <DialogHeader className="px-4 pt-4 pb-3 pr-10 sm:px-6 sm:pt-6 sm:pb-4 border-b border-border/60">
                <DialogTitle className="font-display text-xl sm:text-2xl leading-tight break-words">
                  {activeNote.title}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm break-words">
                  {activeNote.subject || "General"} | {new Date(activeNote.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-4 pt-3 pb-4 sm:px-6 sm:pb-6 overflow-y-auto max-h-[calc(85vh-7.5rem)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Note Content</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
                    {activeNote.content}
                  </p>
                </div>

                {activeNote.explanation ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">AI Explanation</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
                      {activeNote.explanation}
                    </p>
                  </div>
                ) : null}

                {activeNote.file_url ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Attachment</p>
                    <FileViewer url={activeNote.file_url} />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
