import { motion } from "framer-motion";
import { Shield, Users, FileText, Zap, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import LiquidBackground from "@/components/LiquidBackground";
import { useAuth } from "@/context/AuthContext";
import { getAdminSystemData } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Metrics = {
  totalProfiles: number;
  totalNotes: number;
  totalAiUsageRows: number;
  activeUsers: number;
  sampledTokens: number;
};

type ProfileRow = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  student_id?: string;
  grade_level?: string;
  created_at?: string;
};

type NoteRow = {
  id: string;
  user_id?: string;
  title?: string;
  subject?: string;
  created_at?: string;
  updated_at?: string;
};

type AiRow = {
  id: string;
  user_id?: string;
  model?: string;
  generate_type?: string;
  total_tokens?: number;
  created_at?: string;
};

const statCards = (m: Metrics) => [
  { label: "Total Users", value: m.totalProfiles, icon: Users, color: "text-primary" },
  { label: "Active Users", value: m.activeUsers, icon: TrendingUp, color: "text-secondary" },
  { label: "Total Notes", value: m.totalNotes, icon: FileText, color: "text-primary" },
  { label: "AI Requests", value: m.totalAiUsageRows, icon: Zap, color: "text-secondary" },
  { label: "Total Tokens", value: m.sampledTokens, icon: Zap, color: "text-primary" },
];

const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<{
    metrics: Metrics;
    profiles: ProfileRow[];
    notes: NoteRow[];
    aiUsage: AiRow[];
    fetchedAt: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const result = await getAdminSystemData();
        setData(result as typeof data);
      } catch (e: unknown) {
        setError((e as Error).message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="liquid-bg min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <LiquidBackground />
        <div className="relative z-10 text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground font-body">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-bg min-h-screen pt-24 pb-12 px-4">
      <LiquidBackground />
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            System overview and management
            {data?.fetchedAt && ` · Last updated ${fmtDate(data.fetchedAt)}`}
          </p>
        </motion.div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-body animate-pulse">Loading admin data…</p>
          </div>
        )}

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-6">
              <p className="text-destructive font-body">{error}</p>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Stat Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
            >
              {statCards(data.metrics).map((s) => (
                <Card key={s.label} className="bg-card/80 backdrop-blur-sm border-border">
                  <CardContent className="p-4 text-center">
                    <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                    <p className="text-2xl font-display font-bold text-foreground">
                      {s.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs defaultValue="users">
                <TabsList className="w-full md:w-auto flex overflow-x-auto">
                  <TabsTrigger value="users" className="flex-1 md:flex-none text-xs sm:text-sm">Users ({data.profiles.length})</TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1 md:flex-none text-xs sm:text-sm">Notes ({data.notes.length})</TabsTrigger>
                  <TabsTrigger value="ai" className="flex-1 md:flex-none text-xs sm:text-sm">AI ({data.aiUsage.length})</TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Registered Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.profiles.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No users found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.profiles.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium">
                                  {p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "—"}
                                </TableCell>
                                <TableCell>{p.email || "—"}</TableCell>
                                <TableCell>{p.student_id || "—"}</TableCell>
                                <TableCell>{p.grade_level || "—"}</TableCell>
                                <TableCell className="text-xs">{fmtDate(p.created_at)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        All Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.notes.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No notes found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.notes.map((n) => (
                              <TableRow key={n.id}>
                                <TableCell className="font-medium max-w-[200px] truncate">
                                  {n.title || "Untitled"}
                                </TableCell>
                                <TableCell>
                                  {n.subject ? (
                                    <Badge variant="secondary">{n.subject}</Badge>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell className="text-xs font-mono max-w-[120px] truncate">
                                  {n.user_id?.substring(0, 8) || "—"}…
                                </TableCell>
                                <TableCell className="text-xs">{fmtDate(n.created_at)}</TableCell>
                                <TableCell className="text-xs">{fmtDate(n.updated_at)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Usage Tab */}
                <TabsContent value="ai">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        AI Token Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.aiUsage.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No AI usage found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.aiUsage.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="capitalize">
                                  {row.generate_type?.replace(/_/g, " ") || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{row.model || "—"}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {Number(row.total_tokens || 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs font-mono max-w-[120px] truncate">
                                  {row.user_id?.substring(0, 8) || "—"}…
                                </TableCell>
                                <TableCell className="text-xs">{fmtDate(row.created_at)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
