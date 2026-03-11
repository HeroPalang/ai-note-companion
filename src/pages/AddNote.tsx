import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Save, BookOpen, Upload, X, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LiquidBackground from "@/components/LiquidBackground";
import { createNote, getNotesSyncStatus, warmOfflineReadiness, uploadNoteFile } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <Image className="w-5 h-5 text-primary" />;
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return <FileText className="w-5 h-5 text-primary" />;
  return <File className="w-5 h-5 text-primary" />;
};

const AddNote = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const messageFromError = (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl: string | null = null;

      if (file) {
        try {
          fileUrl = await uploadNoteFile(file);
        } catch (uploadErr: unknown) {
          const msg = messageFromError(uploadErr);
          const normalized = msg.toLowerCase();
          if (normalized.includes("session expired")) {
            toast.error("Your login session expired. Please log out and log in again, then retry upload.");
            setLoading(false);
            return;
          }
          if (normalized.includes("row-level security policy")) {
            toast.error("File upload blocked by Storage RLS. Run database/storage_policies.sql in Supabase SQL Editor.");
            setLoading(false);
            return;
          }
          if (msg.toLowerCase().includes("internet") || msg.toLowerCase().includes("online")) {
            toast.error("File upload requires an internet connection. Note saved without attachment.");
          } else {
            toast.error(`File upload failed: ${msg}`);
            setLoading(false);
            return;
          }
        }
      }

      await createNote({
        title: title.trim() || "Untitled Note",
        content: content.trim(),
        subject: subject.trim() || null,
        file_url: fileUrl,
      });

      const { online, pending } = await getNotesSyncStatus();
      if (online && pending === 0) {
        toast.success("Note saved successfully.");
      } else {
        toast.success(`Note saved locally. Pending sync: ${pending}.`);
      }
      warmOfflineReadiness().catch(() => {});
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
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-2">Add New Note</h1>
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

          {/* File Upload */}
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">
              Attachment <span className="text-muted-foreground font-normal">(optional, max 10MB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.md,.pptx,.xlsx,.csv"
            />
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-accent/30 hover:bg-accent/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-body">
                  Click to upload a file
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-accent/50 border border-border p-3">
                {fileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            )}
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
