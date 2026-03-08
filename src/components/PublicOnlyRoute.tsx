import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <>{children}</>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default PublicOnlyRoute;

