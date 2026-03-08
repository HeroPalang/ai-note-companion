import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="relative z-10 border-t border-border py-8 px-6 mt-20">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 font-body font-bold text-primary">
        <img src="/logo.png" alt="Note Explainer logo" className="w-5 h-5 rounded-sm" />
        <span>Note Explainer</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground font-body">
        <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
        <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
      </div>
      <p className="text-xs text-muted-foreground font-body">&copy; 2026 Note Explainer. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
