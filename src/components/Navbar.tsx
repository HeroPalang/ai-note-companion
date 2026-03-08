import { Link, useLocation } from "react-router-dom";
import { BookOpen, LogIn, UserPlus, LayoutDashboard, Info, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const isAuth = isAuthenticated;

  const publicLinks = [
    { to: "/about", label: "About Us", icon: Info },
    { to: "/login", label: "Log In", icon: LogIn },
    { to: "/register", label: "Register", icon: UserPlus },
  ];

  const authLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/notes", label: "My Notes", icon: BookOpen },
    { to: "/add-note", label: "Add Note", icon: BookOpen },
    { to: "/ai-helper", label: "AI Helper", icon: BookOpen },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const links = isAuth ? authLinks : publicLinks;


  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center justify-between gap-6 max-w-4xl w-[calc(100%-2rem)] bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg" style={{ position: 'fixed' }}>
      <Link to="/" className="flex items-center gap-2 font-body font-bold text-primary text-lg shrink-0">
        <img src="/logo.png" alt="Note Explainer logo" className="w-6 h-6 rounded-sm" />
        <span>Note Explainer</span>
      </Link>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-colors ${
              location.pathname === link.to
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {link.label}
          </Link>
        ))}
        {isAuth && (
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium font-body text-destructive hover:bg-destructive/10 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Log Out
            </span>
          </button>
        )}
      </div>

      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground p-1" type="button">
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 liquid-card bg-card/95 backdrop-blur-2xl border-border/70 shadow-2xl p-4 flex flex-col gap-1 md:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium font-body flex items-center gap-2 transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {isAuth && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-3 rounded-lg text-sm font-medium font-body flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
