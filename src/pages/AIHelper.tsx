import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, BookCheck, Loader2, Save, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import LiquidBackground from "@/components/LiquidBackground";
import { toast } from "sonner";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  createNote,
  getNotes,
  getNotesSyncStatus,
  readCachedAuthUser,
  supabase,
  updateNote,
  warmOfflineReadiness,
} from "@/lib/supabase";

type Note = {
  id: string;
  title?: string;
  subject?: string | null;
  content?: string | null;
  file_url?: string | null;
};

type QuizItem = {
  question: string;
  choices: string[];
  answer: string;
};

type AiResponse = {
  explanation?: unknown;
  quiz?: unknown;
  usage?: {
    usedInWindow?: number;
    remainingInWindow?: number;
    limit?: number;
  } | null;
  error?: unknown;
  message?: unknown;
};

const messageFromError = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

const normalizeText = (value: string) =>
  String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

function getCorrectChoiceIndex(answer: string, choices: string[]): number {
  const normalizedAnswer = normalizeText(answer);
  const directMatch = choices.findIndex((choice) => normalizeText(choice) === normalizedAnswer);
  if (directMatch >= 0) return directMatch;

  const letterMatch = normalizedAnswer.match(/^([a-z])(?:[\s).:-]|$)/i);
  if (letterMatch) {
    const index = letterMatch[1].toLowerCase().charCodeAt(0) - 97;
    if (index >= 0 && index < choices.length) return index;
  }

  const numberMatch = normalizedAnswer.match(/^([1-9][0-9]*)(?:[\s).:-]|$)/);
  if (numberMatch) {
    const index = Number(numberMatch[1]) - 1;
    if (index >= 0 && index < choices.length) return index;
  }

  return -1;
}

function extractNoteAttachmentPath(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const marker = "/storage/v1/object/public/note-attachments/";
    const idx = url.pathname.indexOf(marker);
    if (idx < 0) return null;
    return decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch (_error) {
    return null;
  }
}

const AIHelper = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [generateType, setGenerateType] = useState<"explanation" | "questions">("explanation");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [explanation, setExplanation] = useState("");
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});
  const [usage, setUsage] = useState<{ usedInWindow?: number; remainingInWindow?: number; limit?: number } | null>(null);

  const selectedNote = useMemo(
    () => notes.find((note) => String(note.id) === String(selectedNoteId)),
    [notes, selectedNoteId],
  );

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const rows = await getNotes();
        setNotes(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Failed to load notes for AI helper:", error);
      }
    };

    void loadNotes();
  }, []);

  useEffect(() => {
    if (!selectedNote) return;
    setTitle(selectedNote.title || "");
    setSubject(selectedNote.subject || "");
    setNoteContent(selectedNote.content || "");
  }, [selectedNote]);

  const generate = async () => {
    const hasFileSource = Boolean(selectedNote?.file_url);
    const hasTextSource = Boolean(noteContent.trim());
    if (!hasFileSource && !hasTextSource) return;
    setLoading(true);
    setMessage("");
    setExplanation("");
    setQuiz([]);
    setQuizSelections({});

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id || "";
      const cachedUserId = readCachedAuthUser()?.id || "";
      const userId = sessionUserId || cachedUserId;
      if (!userId) throw new Error("Not authenticated. Please log in again.");

      const authToken = sessionData?.session?.access_token || SUPABASE_ANON_KEY;
      let fileUrlForAI = selectedNote?.file_url || null;
      if (fileUrlForAI) {
        const attachmentPath = extractNoteAttachmentPath(fileUrlForAI);
        if (attachmentPath) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from("note-attachments")
            .createSignedUrl(attachmentPath, 300);

          if (!signedError && signedData?.signedUrl) {
            fileUrlForAI = signedData.signedUrl;
          }
        }
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-explanation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          userId,
          title,
          subject,
          content: noteContent,
          fileUrl: fileUrlForAI,
          questionCount,
          difficulty,
          generateType,
        }),
      });

      let parsed: AiResponse | null = null;
      try {
        parsed = (await response.json()) as AiResponse;
      } catch (_error) {
        parsed = null;
      }

      if (!response.ok) {
        const backendMessage = String(parsed?.error || parsed?.message || `HTTP ${response.status}`);
        throw new Error(String(backendMessage));
      }

      const nextExplanation = String(parsed?.explanation || "").trim();
      const rawQuiz = Array.isArray(parsed?.quiz) ? parsed.quiz : [];
      const nextQuiz = rawQuiz
        .map((item) => {
          const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const rawChoices = Array.isArray(record.choices) ? record.choices : [];
          return {
            question: String(record.question || ""),
            choices: rawChoices.map((choice) => String(choice)),
            answer: String(record.answer || ""),
          };
        })
        .filter((item) => item.question);

      if (generateType === "explanation" && !nextExplanation) {
        throw new Error("AI did not return explanation.");
      }
      if (generateType === "questions" && nextQuiz.length === 0) {
        throw new Error("AI did not return quiz questions.");
      }

      setExplanation(nextExplanation);
      setQuiz(nextQuiz);
      setUsage(parsed?.usage || null);
      setMessage("AI content generated.");
      toast.success("AI generation complete.");
    } catch (error: unknown) {
      const rawMessage = messageFromError(error);
      setMessage(`AI generation failed: ${rawMessage}`);
      toast.error(`AI generation failed: ${rawMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const saveExplanation = async () => {
    if (!explanation.trim()) return;
    setSaving(true);
    setMessage("");

    try {
      if (selectedNoteId) {
        await updateNote(selectedNoteId, { explanation });
      } else {
        await createNote({
          title: title.trim() || "AI Generated Note",
          subject: subject.trim() || null,
          content: noteContent.trim(),
          explanation,
        });
      }

      const { online, pending } = await getNotesSyncStatus();
      if (online && pending === 0) {
        setMessage("Explanation saved.");
        toast.success("Explanation saved.");
      } else {
        setMessage(`Explanation saved locally. Pending sync: ${pending}.`);
        toast.success(`Explanation saved locally. Pending sync: ${pending}.`);
      }

      warmOfflineReadiness().catch(() => {
        // best-effort background warmup
      });
    } catch (error: unknown) {
      const rawMessage = messageFromError(error);
      setMessage(`Save failed: ${rawMessage}`);
      toast.error(`Save failed: ${rawMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const selectQuizChoice = (questionIndex: number, choiceIndex: number) => {
    setQuizSelections((prev) => {
      if (typeof prev[questionIndex] === "number") return prev;
      return { ...prev, [questionIndex]: choiceIndex };
    });
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
            Generate explanations and quizzes using the merged backend from AI-Note-Explainer
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-card p-6 md:p-8 mb-6 space-y-4"
        >
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">Use existing note (optional)</label>
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-accent/50 px-3 text-sm"
            >
              <option value="">Manual input</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {(note.title || "Untitled").slice(0, 60)}
                </option>
              ))}
            </select>
            {selectedNote?.file_url ? (
              <div className="flex items-center gap-2 mt-2 text-xs font-body rounded-lg bg-primary/10 text-primary px-3 py-2">
                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                <span>File detected - AI will <strong>read the file content</strong> as the primary source.</span>
              </div>
            ) : selectedNote ? (
              <div className="flex items-center gap-2 mt-2 text-xs font-body text-muted-foreground">
                <BookCheck className="w-3.5 h-3.5 shrink-0" />
                <span>No file attached - AI will read your <strong>written note content</strong>.</span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-body font-semibold text-foreground mb-2 block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl font-body bg-accent/50" />
            </div>
            <div>
              <label className="text-sm font-body font-semibold text-foreground mb-2 block">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-11 rounded-xl font-body bg-accent/50" />
            </div>
          </div>

          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">
              {selectedNote?.file_url ? "Your Note Content (optional when file is attached)" : "Your Note Content"}
            </label>
            <Textarea
              placeholder="Paste or type your note content here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[160px] rounded-xl font-body bg-accent/50 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-body font-semibold text-foreground mb-2 block">Mode</label>
              <select
                value={generateType}
                onChange={(e) => setGenerateType(e.target.value as "explanation" | "questions")}
                className="w-full h-11 rounded-xl border border-border bg-accent/50 px-3 text-sm"
              >
                <option value="explanation">Explanation</option>
                <option value="questions">Questions</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-body font-semibold text-foreground mb-2 block">Questions</label>
              <Input
                type="number"
                min={3}
                max={10}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(3, Math.min(10, Number(e.target.value || 5))))}
                className="h-11 rounded-xl font-body bg-accent/50"
                disabled={generateType !== "questions"}
              />
            </div>
            <div>
              <label className="text-sm font-body font-semibold text-foreground mb-2 block">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-accent/50 px-3 text-sm"
                disabled={generateType !== "questions"}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {message ? <p className="text-sm text-muted-foreground font-body">{message}</p> : null}

          <Button
            onClick={generate}
            disabled={loading || (!selectedNote?.file_url && !noteContent.trim())}
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
                Generate with AI
              </>
            )}
          </Button>
        </motion.div>

        <AnimatePresence>
          {(explanation || quiz.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {explanation ? (
                <div className="liquid-card p-6 md:p-8">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-secondary" />
                    AI Explanation
                  </h2>
                  <p className="text-muted-foreground font-body whitespace-pre-line leading-relaxed">{explanation}</p>
                  <Button
                    onClick={saveExplanation}
                    disabled={saving}
                    className="mt-5 h-11 rounded-xl font-body font-semibold text-sm liquid-hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Explanation"}
                  </Button>
                </div>
              ) : null}

              {quiz.length > 0 ? (
                <div className="liquid-card p-6 md:p-8">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <BookCheck className="w-5 h-5 text-secondary" />
                    Quiz Questions
                  </h2>
                  <ol className="space-y-4">
                    {quiz.map((item, i) => {
                      const correctIndex = getCorrectChoiceIndex(item.answer, item.choices);
                      const selectedIndex = quizSelections[i];
                      const hasSelection = typeof selectedIndex === "number";
                      const selectedWrong = hasSelection && correctIndex >= 0 && selectedIndex !== correctIndex;

                      return (
                        <li key={`${item.question}-${i}`} className="space-y-2 text-muted-foreground font-body">
                          <div className="flex gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm">
                              {i + 1}
                            </span>
                            <p>{item.question}</p>
                          </div>
                          {item.choices?.length ? (
                            <div className="ml-10 grid gap-2">
                              {item.choices.map((choice, idx) => {
                                const isSelected = selectedIndex === idx;
                                const isCorrect = correctIndex === idx;

                                let choiceClass = "border-border bg-background/60 hover:bg-accent/60";
                                if (hasSelection) {
                                  if (isSelected && isCorrect) {
                                    choiceClass = "border-green-600 bg-green-100 text-green-800";
                                  } else if (isSelected && !isCorrect) {
                                    choiceClass = "border-red-600 bg-red-100 text-red-800";
                                  } else if (selectedWrong && isCorrect) {
                                    choiceClass = "border-green-500 bg-green-50 text-green-700";
                                  } else {
                                    choiceClass = "border-border bg-muted/40 text-muted-foreground";
                                  }
                                }

                                return (
                                  <button
                                    key={`${choice}-${idx}`}
                                    type="button"
                                    onClick={() => selectQuizChoice(i, idx)}
                                    disabled={hasSelection}
                                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${choiceClass} ${hasSelection ? "cursor-default" : "cursor-pointer"}`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                          {selectedWrong && correctIndex >= 0 ? (
                            <p className="ml-10 text-xs text-green-700 font-medium">
                              Correct answer: {item.choices[correctIndex]}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}

              {usage?.limit ? (
                <div className="liquid-card p-4 text-sm text-muted-foreground font-body">
                  Token usage: {Number(usage?.usedInWindow || 0).toLocaleString()} / {Number(usage?.limit || 0).toLocaleString()} used
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIHelper;
