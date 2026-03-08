import { motion } from "framer-motion";
import { User, Cloud, CloudOff, Zap, History, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LiquidBackground from "@/components/LiquidBackground";
import { useAuth } from "@/context/AuthContext";
import {
  getNotesSyncStatus,
  getAiTokenUsageStatus,
  getProfile,
  getNotes,
  supabase,
} from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type AiHistoryRow = {
  id: string;
  model: string;
  generate_type: string;
  total_tokens: number;
  created_at: string;
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ online: boolean; pending: number }>({ online: true, pending: 0 });
  const [tokenUsage, setTokenUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);
  const [totalNotes, setTotalNotes] = useState(0);
  const [aiHistory, setAiHistory] = useState<AiHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [prof, sync, usage, notes] = await Promise.all([
        getProfile().catch(() => null),
        getNotesSyncStatus().catch(() => ({ online: true, pending: 0 })),
        getAiTokenUsageStatus(24, 50_000).catch(() => null),
        getNotes().catch(() => []),
      ]);

      setProfile(prof);
      setSyncStatus(sync);
      if (usage) setTokenUsage({ used: usage.used, remaining: usage.remaining, limit: usage.limit });
      setTotalNotes(notes.length);

      // Fetch AI usage history
      if (user?.id) {
        const { data } = await supabase
          .from("ai_token_usage")
          .select("id, model, generate_type, total_tokens, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setAiHistory((data as AiHistoryRow[]) || []);
      }

      setLoading(false);
    };
    void load();
  }, [user?.id]);

  // Listen for sync changes
  useEffect(() => {
    const handler = () => {
      getNotesSyncStatus().then(setSyncStatus).catch(() => {});
    };
    window.addEventListener("notes-sync-updated", handler);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("notes-sync-updated", handler);
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully.");
      navigate("/");
    } catch {
      toast.error("Could not sign out.");
    }
  };

  const initials = (() => {
    const name = (profile as { first_name?: string; last_name?: string })?.first_name;
    const last = (profile as { last_name?: string })?.last_name;
    if (name && last) return `${name[0]}${last[0]}`.toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return "U";
  })();

  const syncedCount = totalNotes - syncStatus.pending;

  return (
    <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
      <LiquidBackground />
      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Avatar className="w-16 h-16 text-xl">
            <AvatarFallback className="bg-primary text-primary-foreground font-display font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              My Profile
            </h1>
            <p className="text-muted-foreground font-body text-sm">
              {user?.email || "Student"}
            </p>
          </div>
        </motion.div>

        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-body">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{user?.email || "—"}</span>
                  </div>
                  {profile && (
                    <>
                      {(profile as { full_name?: string }).full_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="text-foreground">{(profile as { full_name: string }).full_name}</span>
                        </div>
                      )}
                      {(profile as { student_id?: string }).student_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Student ID</span>
                          <span className="text-foreground">{(profile as { student_id: string }).student_id}</span>
                        </div>
                      )}
                      {(profile as { grade_level?: string }).grade_level && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Grade</span>
                          <span className="text-foreground">{(profile as { grade_level: string }).grade_level}</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sync Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                {syncStatus.online ? (
                  <Cloud className="w-5 h-5 text-primary" />
                ) : (
                  <CloudOff className="w-5 h-5 text-destructive" />
                )}
                Notes Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-body text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={syncStatus.online ? "default" : "destructive"}>
                  {syncStatus.online ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Synced Notes</span>
                <span className="text-foreground font-medium">{syncedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Sync</span>
                <Badge variant={syncStatus.pending > 0 ? "secondary" : "outline"}>
                  {syncStatus.pending}
                </Badge>
              </div>
              {syncStatus.pending > 0 && (
                <p className="text-xs text-muted-foreground">
                  These notes will sync automatically when you're back online.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Token Usage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                AI Token Usage (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-body text-sm">
              {tokenUsage ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Used</span>
                    <span className="text-foreground font-medium">
                      {tokenUsage.used.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="text-foreground font-medium">
                      {tokenUsage.remaining.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (tokenUsage.used / tokenUsage.limit) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tokenUsage.used.toLocaleString()} / {tokenUsage.limit.toLocaleString()} tokens
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Usage data unavailable.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                AI Usage History
              </CardTitle>
            </CardHeader>
            <CardContent className="font-body text-sm">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : aiHistory.length === 0 ? (
                <p className="text-muted-foreground">No AI usage yet. Try the AI Study Helper!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {aiHistory.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <span className="font-medium text-foreground capitalize">
                          {row.generate_type?.replace(/_/g, " ") || "Generation"}
                        </span>
                        <span className="text-muted-foreground ml-2 text-xs">{row.model}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-foreground font-medium">
                          {Number(row.total_tokens).toLocaleString()} tokens
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(row.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Separator />

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
