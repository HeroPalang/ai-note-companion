import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LiquidBackground from "@/components/LiquidBackground";
import { toast } from "sonner";
import { cacheAuthUser, supabase, warmOfflineReadiness } from "@/lib/supabase";

const Register = () => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", gradeLevel: "", studentId: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
            student_id: form.studentId.trim() || null,
            grade_level: form.gradeLevel.trim(),
          },
        },
      });

      if (error) {
        setMessage(error.message || "Registration failed.");
        return;
      }

      if (data?.session?.user) {
        cacheAuthUser(data.session.user);
        toast.success("Account created.");
        warmOfflineReadiness().catch(() => {
          // best-effort background warmup
        });
        navigate("/dashboard");
        return;
      }

      toast.success("Account created. Check your email to confirm your registration.");
      navigate("/login");
    } catch (error) {
      console.error("Register failed:", error);
      setMessage("Unexpected error while creating account.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

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
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground font-body">Join Note Explainer and start learning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="First name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="pl-10 h-11 rounded-xl font-body bg-accent/50" required />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Last name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="pl-10 h-11 rounded-xl font-body bg-accent/50" required />
            </div>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className="pl-10 h-11 rounded-xl font-body bg-accent/50" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} className="pl-10 h-11 rounded-xl font-body bg-accent/50" required />
          </div>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Grade level (e.g. Grade 10)" value={form.gradeLevel} onChange={(e) => update("gradeLevel", e.target.value)} className="pl-10 h-11 rounded-xl font-body bg-accent/50" />
          </div>
          <Input
            placeholder="Student ID (optional)"
            value={form.studentId}
            onChange={(e) => update("studentId", e.target.value)}
            className="h-11 rounded-xl font-body bg-accent/50"
          />
          {message ? <p className="text-sm text-destructive font-body">{message}</p> : null}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-body font-semibold text-base liquid-hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Account"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
