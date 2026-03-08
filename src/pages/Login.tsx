import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LiquidBackground from "@/components/LiquidBackground";
import { toast } from "sonner";
import { cacheAuthUser, KEEP_SIGNED_IN_KEY, supabase, warmOfflineReadiness } from "@/lib/supabase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(() => localStorage.getItem(KEEP_SIGNED_IN_KEY) !== "false");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      localStorage.setItem(KEEP_SIGNED_IN_KEY, keepSignedIn ? "true" : "false");
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const raw = String(error.message || "Unable to sign in.");
        const normalized = raw.toLowerCase().includes("failed to fetch") ? "No connection. Try again online." : raw;
        setMessage(normalized);
        return;
      }

      const { data } = await supabase.auth.getSession();
      cacheAuthUser(data?.session?.user);
      toast.success("Login successful.");
      warmOfflineReadiness().catch(() => {
        // best-effort background warmup
      });
      navigate(redirectTo);
    } catch (error) {
      console.error("Login failed:", error);
      setMessage("Unexpected error while signing in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-bg min-h-screen flex items-center justify-center px-4 pt-24 pb-12">
      <LiquidBackground />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="liquid-card p-8 md:p-10 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground font-body">Sign in to continue your studies</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl font-body bg-accent/50 border-border"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl font-body bg-accent/50 border-border"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground font-body">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            Keep me signed in
          </label>
          {message ? <p className="text-sm text-destructive font-body">{message}</p> : null}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-body font-semibold text-base liquid-hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
